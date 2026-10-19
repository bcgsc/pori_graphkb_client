/**
 * Basic formContent and error management states
 */
import { produce, setAutoFreeze } from 'immer';
import { useSnackbar } from 'notistack';
import React, {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
} from 'react';
import { useMutation, useQueryClient } from 'react-query';

import api from '@/services/api';
import schema, { SchemaClassDefinition } from '@/services/schema';

import { useAuth } from '../Auth';
import { GeneralRecordType } from '../types';
import { cleanPayload, FORM_VARIANT } from '../util';

setAutoFreeze(false);

interface PartialSchemaClassDefinition extends Omit<Partial<SchemaClassDefinition>, 'name' | 'properties'> {
  name: string;
  properties: SchemaClassDefinition['properties'];
  // used internally by reducer to keep a copy of the original properties before any modifications
  _properties?: SchemaClassDefinition['properties'];
}

interface ReducerState {
  /** the content/values by field names of the current form */
  content: GeneralRecordType;
  /** the form errors by field names */
  validation: ReturnType<typeof schema.validateValue>;
  /** true when the form has been changed from the initial value */
  isDirty: boolean;
  /** the variant of the form (ex. view) */
  variant: FORM_VARIANT;
  model: PartialSchemaClassDefinition;
}

export interface FormContextState extends ReducerState {
  update: (updates: Record<string, unknown>) => void;
  /** update a single field */
  updateField: (name: string, value: unknown) => void;
  /** update a single field using a synthetic event */
  updateFieldEvent: (event: { target: { name: string; value: unknown } }) => void;
  /** setter for setting the formIsDirty property */
  setDirty: (dirty: boolean) => void;
}

export const FormContext = React.createContext<FormContextState | null>(null);

export const useFormContext = () => {
  const value = useContext(FormContext);

  if (!value) {
    throw new Error('missing FormContext provider');
  }
  return value;
};

interface UseSchemaFormOptions {
  /** the form type/variant (ex. view) */
  variant?: FORM_VARIANT;
  /** a function which should return an error message if failed and empty string if passed. Accepts the formContent as input */
  additionalValidationFn?: ((content: unknown) => string) | null;
  onActionSuccess?: (result?: GeneralRecordType) => void;
}

enum ACTION_TYPE {
  UPDATE_FORM = 'UPDATE_FORM',
  RESET_FORM = 'RESET_FORM',
  SET_FORM_DIRTY = 'SET_FORM_DIRTY',
}

type PayloadMap = {
  [ACTION_TYPE.RESET_FORM]: {
    model: ReducerState['model'];
    initialValue: GeneralRecordType | undefined;
    variant: FORM_VARIANT;
  };
  [ACTION_TYPE.UPDATE_FORM]: Record<string, unknown>;
};

type Action<T extends ACTION_TYPE> = T extends keyof PayloadMap ? { type: T; payload: PayloadMap[T] } : { type: T };

// eslint-disable-next-line consistent-return
export function reducer<T extends ACTION_TYPE>(draft: ReducerState, action: Action<T>): ReducerState | void {
  const propsToValidate: string[] = [];

  if (action.type === ACTION_TYPE.RESET_FORM) {
    const payload = action.payload as PayloadMap[ACTION_TYPE.RESET_FORM];

    draft.model = payload.model;
    draft.content = payload.initialValue ?? {};
    draft.variant = payload.variant;
    draft.isDirty = payload.variant === FORM_VARIANT.EDIT;
    draft.validation = { valid: true, properties: {} };

    if (payload.variant === FORM_VARIANT.VIEW) {
      return;
    }

    Object.values(payload.model.properties).forEach((prop) => {
      propsToValidate.push(prop.name);
      let value = draft.content?.[prop.name];

      if ((value === undefined || (value === null && !prop.nullable)) && payload.variant === FORM_VARIANT.NEW && !prop.readOnly && !prop.generated) {
        if (prop.default !== undefined) {
          value = prop.default;
        } else if (prop.generateDefault) {
          value = prop.generateDefault(draft.content);
        } else if (!prop.nullable && prop.type === 'embedded' && prop.linkedClass) {
          value = { '@class': prop.linkedClass };
        }
      } else if (value && prop.type === 'embedded' && prop.linkedClass) {
        filterEmbeddedValue(prop, value);
      }

      draft.content[prop.name] = value;
    });
  }
  if (action.type === ACTION_TYPE.SET_FORM_DIRTY || action.type === ACTION_TYPE.UPDATE_FORM) {
    draft.isDirty = true;
  }

  if (action.type === ACTION_TYPE.UPDATE_FORM) {
    const { model } = draft;
    // fully update record, then validate
    Object.entries(action.payload as PayloadMap[ACTION_TYPE.UPDATE_FORM]).forEach(([propPath, propValue]) => {
      const [propName, subPropName] = propPath.split('.');
      const propModel = model.properties[propName];

      if (propModel) {
        propsToValidate.push(propName);
      }

      if (subPropName) {
        // embedded
        draft.content[propName] ??= { '@class': propModel?.linkedClass };
        draft.content[propName][subPropName] = propValue;
      } else {
        draft.content[propName] = propValue;
      }
    });

    propsToValidate.forEach((propName) => {
      // re-build the display name template for the statement
      // TODO: add flag to property to auto regenerating defaults
      if (
        ['subject', 'conditions', 'relevance'].includes(propName)
        && model.properties.displayNameTemplate
        && model.properties.displayNameTemplate.generateDefault
        && draft.content.displayNameTemplate
      ) {
        const { displayNameTemplate: _, ...rest } = draft.content;
        draft.content.displayNameTemplate = model.properties.displayNameTemplate.generateDefault(rest) as string;
      }

      const propModel = model.properties[propName];

      if (propModel?.type === 'embedded' && propModel.linkedClass) {
        filterEmbeddedValue(propModel, draft.content[propName]);
      }
    });
  }

  draft.model._properties ??= draft.model.properties;
  draft.model.properties = produce(draft.model._properties, (draftProps) => {
    draft.model.conditional?.(draftProps, draft);
  });

  Object.entries(draft.model.properties).forEach(([propName, propModel]) => {
    const result = schema.validateValue(propModel, draft.content[propName]);
    draft.validation.properties ??= {};
    draft.validation.properties[propName] ??= { valid: true };
    const prev = draft.validation.properties[propName];
    prev.valid = result.valid;
    prev.message = result.message;
    prev.items = result.items;
    prev.properties = result.properties;
  });

  draft.validation.valid = Object.values(draft.validation.properties ?? {}).every((r) => r?.valid !== false);
}

/**
 * Filters out invalid properties from an embedded value based on the linked model/specified class.
 *
 * if not an embedded property or no linked class, returns the value as is.
 */
function filterEmbeddedValue(prop: FormContextState['model']['properties'][string], value: unknown): void {
  if (!value || !prop.linkedClass || prop.type !== 'embedded' || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((v) => filterEmbeddedValue(prop, v));
    return;
  }

  let model = schema.get(prop.linkedClass);

  if (value['@class'] && (value['@class'] === prop.linkedClass || schema.inheritsFrom(value['@class'], prop.linkedClass))) {
    model = schema.get(value['@class']);
  }

  value['@class'] = model.name;

  Object.keys(value).forEach((key) => {
    if (key !== '@class' && !model.properties[key]) {
      delete value[key];
    }
  });
}

export function shouldHideField(
  variant: FORM_VARIANT,
  prop: FormContextState['model']['properties'][string],
  value: unknown,
): boolean {
  const isEmpty = value === '' || value === null || value === undefined;

  return prop.hide ?? (
    (variant === FORM_VARIANT.NEW && prop.generated)
    || (variant === FORM_VARIANT.EDIT && prop.generated && isEmpty)
    || (variant === FORM_VARIANT.VIEW && isEmpty)
  );
}

interface UseSchemaFormReturnType extends FormContextState {
  action: {
    error: Error | null;
    inProgress: boolean,
    errorMessage: string | undefined;
    actionType: string | undefined;
    submit: () => void;
    delete: () => void;
  }
}

/**
 * Sets up two objects for handling form content and errors when the properties are not known
 *
 * @param initialFieldDefs field definitions to use in validating the form
 * @param initialValue the start value of the form content
 * @param props extra options
 *
 * @returns {UseSchemaFormReturnType} the form context values
 */
const useSchemaForm = (
  initialModel: FormContextState['model'],
  initialValue: GeneralRecordType | undefined,
  { variant = FORM_VARIANT.VIEW, additionalValidationFn, onActionSuccess }: UseSchemaFormOptions = {},
): UseSchemaFormReturnType => {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const [state, dispatch] = useReducer(produce(reducer), produce(reducer)({
    model: initialModel,
    content: initialValue ?? {},
    variant,
    isDirty: false,
    validation: { valid: true, properties: {} },
  }, { type: ACTION_TYPE.RESET_FORM, payload: { model: initialModel, initialValue, variant } }));

  // reset form state if any of initial value/model/variant change
  useLayoutEffect(() => {
    dispatch({ type: ACTION_TYPE.RESET_FORM, payload: { model: initialModel, initialValue, variant } });
  }, [variant, initialValue, initialModel]);

  const additionalValidationError = useMemo(() => additionalValidationFn?.(state.content) ?? '', [state.content, additionalValidationFn]);

  const hasErrors = Boolean(additionalValidationError || !state.validation.valid);

  const update = useCallback((updates: Record<string, unknown>) => {
    dispatch({ type: ACTION_TYPE.UPDATE_FORM, payload: updates });
  }, []);

  // provide an update callback which includes the validation step
  const updateField = useCallback((propPath: string, propValue: unknown) => {
    update({ [propPath]: propValue });
  }, [update]);

  const updateFieldEvent = useCallback(({ target }) => {
    // add the new value to the field
    const eventName = target.name || (target.getAttribute && target.getAttribute('name')); // name of the form field triggering the event
    const eventValue = target.value;
    update({ [eventName]: eventValue });
  }, [update]);

  const setDirty = useCallback(() => {
    dispatch({ type: ACTION_TYPE.SET_FORM_DIRTY });
  }, []);

  const auth = useAuth();

  const mutation = useMutation({
    mutationFn: async ({ actionType }: { actionType: 'create' | 'update' | 'delete' }) => {
      const routeName = state.model.routeName;

      if (!routeName) {
        throw new Error(`actions are not supported for model of type ${state.model.name} due to missing routeName.`);
      }
      const payload = cleanPayload(state.content);
      payload['@class'] ??= state.model.name;

      if (actionType === 'update' && payload.displayName) {
        delete payload.displayName;
      }

      if (state.model.name === 'PositionalVariant') {
        /* KBDEV-1216 Adding refAA to break1Start property when new variant has ProteinPosition coordinate system.
        Property has the same value as refSeq and should be hidden from users to avoid confusion. */
        if (payload?.break1Start && payload?.break1Start['@class'] === 'ProteinPosition') {
          const refAA = payload.refSeq ? payload.refSeq : '';
          payload.break1Start = { ...payload.break1Start, refAA };
        }
      } else if (state.model.name === 'Statement' && actionType === 'create') {
        payload.reviewStatus ??= 'initial';

        if (!payload.reviews) {
          payload.reviews = [{
            status: 'initial',
            comment: '',
            createdBy: auth.user?.['@rid'],
          }];
        }
      }

      const rid = payload['@rid']?.replace(/^#/, '');

      if (actionType === 'create') {
        return api.post(routeName, payload);
      } if (actionType === 'update') {
        return api.patch(`${routeName}/${rid}`, payload);
      }
      return api.delete(`${routeName}/${rid}`);
    },
    onSuccess: (result, { actionType }) => {
      const { routeName } = state.model;

      if (result['@rid'] && routeName) {
        const cleanRid = result['@rid'].replace(/^#/, '');

        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryString = String(query.queryKey[0]);
            return queryString.includes(routeName) && queryString.includes(cleanRid);
          },
        });

        if (actionType !== 'delete') {
          queryClient.refetchQueries({
            predicate: (query) => {
              const queryString = String(query.queryKey[0]);
              return queryString.includes(routeName) && queryString.includes(cleanRid);
            },
          });
        }
      }

      snackbar.enqueueSnackbar(`Successfully ${actionType}d the record ${result['@rid']}`, { variant: 'success' });
      onActionSuccess?.(result);
    },
  });
  const { mutate } = mutation;

  const handleSubmit = useCallback(() => {
    if (hasErrors) {
      // bring up the snackbar for errors
      console.error(state.validation);
      snackbar.enqueueSnackbar('There are errors in the form which must be resolved before it can be submitted.', { variant: 'error' });
      dispatch({ type: ACTION_TYPE.SET_FORM_DIRTY });
    } else if (variant === FORM_VARIANT.EDIT && !state.isDirty) {
      snackbar.enqueueSnackbar('no changes to submit');
      onActionSuccess?.();
    } else {
      // ok to submit
      mutate({ actionType: variant === FORM_VARIANT.NEW ? 'create' : 'update' });
    }
  }, [hasErrors, variant, state.isDirty, state.validation, snackbar, onActionSuccess, mutate]);

  const handleDelete = useCallback(() => {
    mutate({ actionType: 'delete' });
  }, [mutate]);

  return {
    content: state.content,
    validation: {
      ...state.validation,
      valid: !hasErrors,
      message: additionalValidationError,
    },
    isDirty: state.isDirty,
    variant,
    setDirty,
    update,
    updateField,
    updateFieldEvent,
    model: state.model,
    action: {
      error: mutation.error,
      inProgress: mutation.isPending,
      errorMessage: mutation.error ? `An error occurred while ${mutation?.variables?.actionType.slice(0, -1) ?? 'submitt'}ing record.` : undefined,
      actionType: mutation.variables?.actionType ?? undefined,
      submit: handleSubmit,
      delete: handleDelete,
    },
  };
};

export function useEmbeddedForm(propName: string, defaultLinkedClass: string | undefined): FormContextState {
  const form = useFormContext();
  const { updateField: updateParent, update: updateForm } = form;
  const content = useMemo(() => form.content[propName] ?? {}, [form.content, propName]);
  const validation = useMemo(() => form.validation.properties?.[propName] ?? { valid: true }, [form.validation.properties, propName]);
  const prop = form.model.properties[propName];
  const propClass = schema.get(content['@class'] ?? defaultLinkedClass ?? prop.linkedClass);
  const update = useCallback((updates: Record<string, unknown>) => {
    updateForm(Object.fromEntries(Object.entries(updates).map(([key, value]) => [`${propName}.${key}`, value])));
  }, [propName, updateForm]);
  const updateFieldEvent = useCallback((e) => {
    updateParent(`${propName}.${e.target.name}`, e.target.value);
  }, [updateParent, propName]);
  const updateField = useCallback((name, value) => {
    updateParent(`${propName}.${name}`, value);
  }, [updateParent, propName]);

  return {
    content,
    validation,
    isDirty: form.isDirty,
    variant: form.variant,
    setDirty: form.setDirty,
    model: propClass,
    updateFieldEvent,
    updateField,
    update,
  };
}

export default useSchemaForm;
