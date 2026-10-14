/**
 * Basic formContent and error management states
 */
import { isEqual } from 'lodash';
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

import schema from '@/services/schema';

import { FormContextState, useFormContext } from '../FormContext';
import { GeneralRecordType } from '../types';
import { FORM_VARIANT } from '../util';

interface UseSchemaFormOptions {
  /** the form type/variant (ex. view) */
  variant?: FORM_VARIANT | '';
  /** a function which should return an error message if failed and empty string if passed. Accepts the formContent as input */
  additionalValidationFn?: ((content: unknown) => string) | null;
}

/**
 * Filters out invalid properties from an embedded value based on the linked model/specified class.
 *
 * if not an embedded property or no linked class, returns the value as is.
 */
function filterEmbeddedValue(prop: FormContextState['model']['properties'][string], value: unknown) {
  if (!value || !prop.linkedClass || prop.type !== 'embedded' || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((v) => filterEmbeddedValue(prop, v));
  }
  if (typeof value !== 'object') return value;

  let model = schema.get(prop.linkedClass);

  if (value['@class'] && schema.inheritsFrom(value['@class'], prop.linkedClass)) {
    model = schema.get(value['@class']);
  }

  const filteredValue = { '@class': model.name };
  Object.entries(value).forEach(([key, value]) => {
    if (key !== '@class' && model.properties[key]) {
      filteredValue[key] = value;
    }
  });

  return filteredValue;
}

function getInitialFormState(
  model: FormContextState['model'],
  initialContent: FormContextState['formContent'] | undefined,
  variant: FORM_VARIANT | '',
) {
  const nextState: Pick<FormContextState, 'formContent' | 'formErrors' | 'formIsDirty'> = {
    formContent: { ...initialContent ?? {} },
    formErrors: {},
    formIsDirty: variant === FORM_VARIANT.EDIT,
  };

  if (variant === FORM_VARIANT.VIEW) {
    return nextState;
  }

  Object.values(model.properties).forEach((prop) => {
    let value = initialContent?.[prop.name];

    if ((value === undefined || (value === null && !prop.nullable)) && variant === FORM_VARIANT.NEW && !prop.readOnly && !prop.generated) {
      if (prop.default !== undefined) {
        value = prop.default;
      } else if (prop.generateDefault) {
        value = prop.generateDefault(initialContent ?? {});
      } else if (!prop.nullable && prop.type === 'embedded' && prop.linkedClass) {
        value = { '@class': prop.linkedClass };
      }
    } else if (value && prop.type === 'embedded' && prop.linkedClass) {
      value = filterEmbeddedValue(prop, value);
    }
    const error = schema.validateValue(prop, value, { ignoreMandatory: false });

    nextState.formContent[prop.name] = value;
    nextState.formErrors[prop.name] = error as Error | null;
  });

  return nextState;
}

/**
 * Sets up two objects for handling form content and errors when the properties are not known
 *
 * @param initialFieldDefs field definitions to use in validating the form
 * @param initialValue the start value of the form content
 * @param props extra options
 *
 * @returns {FormContext} the form context values
 */
const useSchemaForm = (
  model: FormContextState['model'],
  initialValue: GeneralRecordType | undefined,
  { variant: formVariant = '', additionalValidationFn = null }: UseSchemaFormOptions = {},
): FormContextState => {
  const [{ formContent, formErrors, formIsDirty }, setFormState] = useState<Pick<FormContextState, 'formContent' | 'formErrors' | 'formIsDirty'>>(getInitialFormState(model, initialValue, formVariant));

  // reset form state if any of initial value/model/variant change
  useLayoutEffect(() => {
    setFormState(getInitialFormState(model, initialValue, formVariant));
  }, [formVariant, initialValue, model]);

  const additionalValidationError = useMemo(() => additionalValidationFn?.(formContent) ?? '', [formContent, additionalValidationFn]);

  const formHasErrors = useMemo(() => {
    const errorState = Object.values(formErrors).some((err) => err);
    return errorState || !!additionalValidationError;
  }, [formErrors, additionalValidationError]);

  const update = useCallback((updates: Record<string, unknown>) => {
    setFormState((prev) => {
      const modified: string[] = [];
      const next = {
        formIsDirty: true,
        formContent: { ...prev.formContent },
        formErrors: { ...prev.formErrors },
      };
      // fully update record, then validate
      Object.entries(updates).forEach(([propPath, propValue]) => {
        const [propName, subPropName] = propPath.split('.');
        const propModel = model.properties[propName];

        let nextValue = propValue;

        if (subPropName) {
          // embedded
          nextValue = {
            ...(prev.formContent[propName] ?? { '@class': propModel?.linkedClass }),
            [subPropName]: propValue,
          };
        }

        const prevValue = prev.formContent[propName];

        if (propModel && !isEqual(prevValue, nextValue)) {
          modified.push(propName);
          next.formContent[propName] = nextValue;
        }
      });

      if (!modified.length) {
        return prev;
      }

      modified.forEach((propName) => {
        // re-build the display name template for the statement
        // TODO: add flag to property to auto regenerating defaults
        if (
          ['subject', 'conditions', 'relevance'].includes(propName)
        && model.properties.displayNameTemplate
        && model.properties.displayNameTemplate.generateDefault
        && next.formContent.displayNameTemplate
        ) {
          const { displayNameTemplate: _, ...rest } = next.formContent;
          next.formContent = {
            ...next.formContent,
            displayNameTemplate: model.properties.displayNameTemplate.generateDefault(rest) as string,
          };
        }

        const propModel = model.properties[propName];

        if (propModel?.type === 'embedded' && propModel.linkedClass) {
          next.formContent[propName] = filterEmbeddedValue(propModel, next.formContent[propName]);
        }

        const error = schema.validateValue(propModel, next.formContent[propName], { ignoreMandatory: false });
        next.formErrors[propName] = error as Error | null;
      });

      return next;
    });
  }, [model]);

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

  const setFormIsDirty = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      formIsDirty: true,
    }));
  }, []);

  return {
    formContent,
    formErrors,
    formHasErrors,
    formIsDirty,
    formVariant,
    additionalValidationError,
    setFormIsDirty,
    update,
    updateField,
    updateFieldEvent,
    model,
  };
};

export function useEmbeddedForm(propName: string, defaultLinkedClass: string | undefined): FormContextState {
  const form = useFormContext();
  const { updateField: updateParent, update: updateForm } = form;
  const formContent = useMemo(() => form.formContent[propName] ?? {}, [form.formContent, propName]);
  const formErrors = useMemo(() => (form.formErrors[propName] ?? {}) as unknown as Record<string, Error>, [form.formErrors, propName]);
  const prop = form.model.properties[propName];
  const propClass = schema.get(formContent['@class'] ?? defaultLinkedClass ?? prop.linkedClass);
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
    formContent,
    formErrors,
    formHasErrors: form.formHasErrors,
    formIsDirty: form.formIsDirty,
    additionalValidationError: '',
    formVariant: form.formVariant,
    setFormIsDirty: form.setFormIsDirty,
    model: propClass,
    updateFieldEvent,
    updateField,
    update,
  };
}

export default useSchemaForm;
