/**
 * Basic formContent and error management states
 */
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';

import schema from '@/services/schema';

import useObject from './useObject';

/**
 * Sets up two objects for handling form content and errors when the properties are not known
 *
 * @param {Object.<string,PropertyModel>} initialFieldDefs field definitions to use in validating the form
 * @param {Object} initialValue the start value of the form content
 * @param {Object} props extra options
 * @param {boolean} props.ignoreMandatoryErrors do not throw errors when required fields are missing
 * @param {string} props.variant the form type/variant (ex. view)
 * @param {function}
 *
 * @returns {FormContext} the form context values
 */
const useSchemaForm = (
  initialFieldDefs,
  initialValue = {},
  { ignoreMandatoryErrors = false, variant = '', additionalValidationFn = null } = {},
) => {
  const [formIsDirty, setFormIsDirty] = useState(false);
  const [formHasErrors, setFormHasErrors] = useState(false);
  const [formVariant, setFormVariant] = useState(variant);
  const [fieldDefs, setFieldDefs] = useState(initialFieldDefs);
  const [additionalValidationError, setAdditionalValidationError] = useState('');

  useEffect(() => {
    setFormVariant(variant);
  }, [variant]);

  useDeepCompareEffect(() => {
    setFieldDefs(initialFieldDefs);
  }, [initialFieldDefs || {}]);

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
  } = useObject({});

  const formValidator = useCallback((propName, propValue) => {
    const prop = fieldDefs[propName];

    if (prop) {
      return schema.validateValue(prop, propValue, { ignoreMandatory: ignoreMandatoryErrors });
    }

    return { value: propValue };
  }, [fieldDefs, ignoreMandatoryErrors]);

  useDeepCompareEffect(() => {
    const errorState = Object.values(formErrors).some(err => err);
    setFormHasErrors(errorState || additionalValidationError);
  }, [formErrors || {}, additionalValidationError]);

  useDeepCompareEffect(() => {
    if (additionalValidationFn) {
      setAdditionalValidationError(additionalValidationFn(formContent));
    }
  }, [formContent || {}, additionalValidationFn]);


  // check the initial content for errors
  useDeepCompareEffect(() => {
    replaceContent(initialValue);
    replaceErrors({});

    Object.values(fieldDefs).forEach((prop) => {
      const propValue = (initialValue || {})[prop.name];

      const { error, value } = formValidator(prop.name, propValue);
      setFormFieldContent(prop.name, value);
      setFormFieldError(prop.name, error);
    });

    setFormIsDirty(false);
  }, [initialValue || {}, fieldDefs || {}]);

  // provide an update callback which includes the validation step
  const updateField = useCallback((propName, propValue) => {
    const { value, error } = formValidator(propName, propValue);

    setFormFieldContent(propName, value);
    setFormFieldError(propName, error);

    // re-build the display name template for the statement
    // TODO: add flag to property to auto regenerating defaults
    if (
      ['subject', 'conditions', 'relevance'].includes(propName)
      && fieldDefs.displayNameTemplate
      && fieldDefs.displayNameTemplate.generateDefault
      && formContent.displayNameTemplate
    ) {
      const { displayNameTemplate, ...rest } = formContent;
      const newTemplate = fieldDefs.displayNameTemplate.generateDefault({ ...rest, [propName]: value });
      setFormFieldContent('displayNameTemplate', newTemplate);
    }

    if (error) {
      setFormHasErrors(true);
    }
    setFormIsDirty(true);
  }, [fieldDefs.displayNameTemplate, formContent, formValidator, setFormFieldContent, setFormFieldError]);

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
    setFormIsDirty,
    update,
    updateField,
    updateFieldEvent,
    formVariant,
    additionalValidationError,
  };
};

export default useSchemaForm;
