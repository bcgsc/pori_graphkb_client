/**
 * Basic formContent and error management states
 */
import {
  useState, useReducer, useCallback,
} from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';


/**
 * @typedef ValidatedResult
 *
 * @property {object} error any errors detected for this property during validation
 * @property {any} value the new value (may have been cast or re-formatted by the validation function)
 */


/**
 * @typdef validatorFunction
 * @param {string} name the property name
 * @param {*} value the property value
 *
 * @returns {ValidatedResult} the value and error returned from the validator
 */


const defaultValidator = (propName, value) => ({ value });


/**
 * Sets up two objects for handling form content and errors when the properties are not known
 */
const useForm = (initialValue = {}, validator = defaultValidator, expected = []) => {
  const [formIsDirty, setFormIsDirty] = useState(false);
  const [formHasErrors, setFormHasErrors] = useState(false);
  const [expectedProps, setExpectedProps] = useState(expected || []);

  // handle and store the form content
  const [formContent, setFormFieldContent] = useReducer((state, action) => {
    const { type: actionType, payload } = action;

    if (actionType === 'update') {
      const { name, value } = payload;
      return { ...state, [name]: value };
    } if (actionType === 'replace') {
      return { ...payload };
    }
    throw new Error(`actionType (${actionType}) not implemented`);
  }, initialValue || {});

  // handle and store any errors reported from form field validators
  const [formErrors, setFormFieldError] = useReducer((state, action) => {
    const { type: actionType, payload } = action;

    if (actionType === 'update') {
      const { name, value } = payload;
      return { ...state, [name]: value };
    } if (actionType === 'replace') {
      return { ...payload };
    }
    throw new Error(`actionType (${actionType}) not implemented`);
  }, {});

  useDeepCompareEffect(() => {
    setExpectedProps(expected);
  }, [expected]);

  useDeepCompareEffect(() => {
    const errorState = Object.values(formErrors).some(err => err);
    setFormHasErrors(errorState);
  }, [formErrors || {}]);


  useDeepCompareEffect(() => {
    setFormFieldContent({ type: 'replace', payload: initialValue || {} });

    const initialErrors = {};
    Object.entries(initialValue || {}).forEach(([propName, propValue]) => {
      const { error } = validator(propName, propValue);

      if (error) {
        initialErrors[propName] = error;
      }
    });

    expectedProps.forEach((propName) => {
      const propValue = (initialValue || {})[propName];
      const { error } = validator(propName, propValue);

      if (error) {
        initialErrors[propName] = error;
      }
    });

    setFormFieldError({ type: 'replace', payload: initialErrors });
    const errorState = Object.values(initialErrors).some(err => err);
    setFormHasErrors(errorState);
    setFormIsDirty(false);
  }, [initialValue, validator]);

  const updateForm = useCallback((propName, propValue) => {
    const { value, error } = validator(propName, propValue);

    setFormFieldContent({ type: 'update', payload: { name: propName, value } });
    setFormFieldError({ type: 'update', payload: { name: propName, value: error } });

    if (error) {
      setFormHasErrors(true);
    }
    setFormIsDirty(true);
  }, [validator]);

  return {
    formContent, formErrors, updateForm, formIsDirty, formHasErrors, setFormIsDirty,
  };
};

export default useForm;
