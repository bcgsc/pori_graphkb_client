/**
 * Basic formContent and error management states
 */
import { produce, setAutoFreeze } from 'immer';
import React, {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
} from 'react';

import schema, { SchemaPropertyDefinition } from '@/services/schema';

import { GeneralRecordType } from '../types';
import { FORM_VARIANT } from '../util';

setAutoFreeze(false);

interface ReducerState {
  /** the content/values by field names of the current form */
  content: GeneralRecordType;
  /** the form errors by field names */
  validation: ReturnType<typeof schema.validateValue>;
  /** true when the form has been changed from the initial value */
  isDirty: boolean;
  /** the variant of the form (ex. view) */
  variant: FORM_VARIANT;
  model: {
    name?: string;
    properties: Record<string, Partial<SchemaPropertyDefinition> & {
      name: string;
    }>;
    isEdge?: boolean;
  }
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

  propsToValidate.forEach((propName) => {
    const result = schema.validateValue(draft.model.properties[propName], draft.content[propName]);
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

/**
 * Sets up two objects for handling form content and errors when the properties are not known
 *
 * @param initialFieldDefs field definitions to use in validating the form
 * @param initialValue the start value of the form content
 * @param props extra options
 *
 * @returns {FormContextState} the form context values
 */
const useSchemaForm = (
  initialModel: FormContextState['model'],
  initialValue: GeneralRecordType | undefined,
  { variant = FORM_VARIANT.VIEW, additionalValidationFn }: UseSchemaFormOptions = {},
): FormContextState => {
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

  return {
    content: state.content,
    validation: {
      ...state.validation,
      valid: state.validation.valid && !additionalValidationError,
      message: additionalValidationError,
    },
    isDirty: state.isDirty,
    variant,
    setDirty,
    update,
    updateField,
    updateFieldEvent,
    model: state.model,
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
