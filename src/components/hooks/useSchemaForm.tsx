/**
 * Basic formContent and error management states
 */
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

import schema from '@/services/schema';

import { FormContextState } from '../FormContext';
import { GeneralRecordType } from '../types';
import { FORM_VARIANT } from '../util';

interface UseSchemaFormOptions {
  /** the form type/variant (ex. view) */
  variant?: FORM_VARIANT | '';
  /** a function which should return an error message if failed and empty string if passed. Accepts the formContent as input */
  additionalValidationFn?: ((content: unknown) => string) | null;
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
      }
    }

    const { error, value: validatedValue } = schema.validateValue(prop, value, { ignoreMandatory: false });

    nextState.formContent[prop.name] = validatedValue;
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

  // provide an update callback which includes the validation step
  const updateField = useCallback((propName: string, propValue: unknown) => {
    setFormState((prev) => {
      if (prev.formContent[propName] === propValue) {
        return prev;
      }
      const { value, error } = schema.validateValue(model.properties[propName], propValue, { ignoreMandatory: false });
      const next = {
        formContent: {
          ...prev.formContent,
          [propName]: value,
        },
        formErrors: {
          ...prev.formErrors,
          [propName]: error as Error | null,
        },
        formIsDirty: true,
      };

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
          displayNameTemplate: model.properties.displayNameTemplate.generateDefault({ ...rest, [propName]: value }) as string,
        };
      }
      return next;
    });
  }, [model, setFormState]);

  const updateFieldEvent = useCallback(({ target }) => {
    // add the new value to the field
    const eventName = target.name || (target.getAttribute && target.getAttribute('name')); // name of the form field triggering the event
    const eventValue = target.value;
    updateField(eventName, eventValue);
  }, [updateField]);

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
    updateField,
    updateFieldEvent,
    model,
  };
};

export default useSchemaForm;
