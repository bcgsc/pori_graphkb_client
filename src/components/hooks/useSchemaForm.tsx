/**
 * Basic formContent and error management states
 */
import {
  useCallback,
  useMemo,
  useState,
} from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';

import schema from '@/services/schema';

import { FormContextState } from '../FormContext';
import { GeneralRecordType } from '../types';
import { FORM_VARIANT } from '../util';
import useObject from './useObject';

interface UseSchemaFormOptions {
  /** do not throw errors when required fields are missing */
  ignoreMandatoryErrors?: boolean;
  /** the form type/variant (ex. view) */
  variant?: FORM_VARIANT | '';
  /** a function which should return an error message if failed and empty string if passed. Accepts the formContent as input */
  additionalValidationFn?: ((content: unknown) => string) | null;
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
  initialModel: FormContextState['model'],
  initialValue: GeneralRecordType = {},
  err: Record<string, any> = {},
  { ignoreMandatoryErrors = false, variant: formVariant = '', additionalValidationFn = null }: UseSchemaFormOptions = {},
): FormContextState => {
  const [formIsDirty, setFormIsDirty] = useState(false);
  const [model, setModel] = useState(initialModel);
  const [additionalValidationError, setAdditionalValidationError] = useState('');

  useDeepCompareEffect(() => {
    setModel(initialModel);
  }, [initialModel]);

  // handle and store the form content
  const {
    content: formContent,
    updateField: setFormFieldContent,
    replace: replaceContent,
    update,
  } = useObject(initialValue);

  const {
    content: formErrors,
    updateField: setFormFieldError,
    replace: replaceErrors,
  } = useObject(err);

  const formValidator = useCallback((propName, propValue) => {
    const prop = model.properties[propName];

    if (prop) {
      return schema.validateValue(prop, propValue, { ignoreMandatory: ignoreMandatoryErrors });
    }

    return { value: propValue };
  }, [model, ignoreMandatoryErrors]);

  const formHasErrors = useMemo(() => {
    const errorState = Object.values(formErrors).some((err) => err);
    return errorState || !!additionalValidationError;
  }, [formErrors, additionalValidationError]);

  useDeepCompareEffect(() => {
    if (additionalValidationFn) {
      setAdditionalValidationError(additionalValidationFn(formContent));
    }
  }, [formContent || {}, additionalValidationFn]);

  // check the initial content for errors
  useDeepCompareEffect(() => {
    replaceContent(initialValue);
    replaceErrors({});

    Object.values(model.properties).forEach((prop) => {
      const propValue = (initialValue || {})[prop.name];

      const { error, value } = formValidator(prop.name, propValue);
      setFormFieldContent(prop.name as keyof GeneralRecordType, value);
      setFormFieldError(prop.name, error);
    });

    setFormIsDirty(false);
  }, [initialValue || {}, model]);

  // provide an update callback which includes the validation step
  const updateField = useCallback((propName, propValue) => {
    const { value, error } = formValidator(propName, propValue);

    setFormFieldContent(propName, value);
    setFormFieldError(propName, error);

    // re-build the display name template for the statement
    // TODO: add flag to property to auto regenerating defaults
    if (
      ['subject', 'conditions', 'relevance'].includes(propName)
      && model.properties.displayNameTemplate
      && model.properties.displayNameTemplate.generateDefault
      && formContent.displayNameTemplate
    ) {
      const { displayNameTemplate: _, ...rest } = formContent;
      const newTemplate = model.properties.displayNameTemplate.generateDefault({ ...rest, [propName]: value });
      setFormFieldContent('displayNameTemplate', newTemplate);
    }

    setFormIsDirty(true);
  }, [model.properties.displayNameTemplate, formContent, formValidator, setFormFieldContent, setFormFieldError]);

  const updateFieldEvent = useCallback(({ target }) => {
    // add the new value to the field
    const eventName = target.name || (target.getAttribute && target.getAttribute('name')); // name of the form field triggering the event
    const eventValue = target.value;
    updateField(eventName, eventValue);
  }, [updateField]);

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
    replaceContent,
    model,
  };
};

export default useSchemaForm;
