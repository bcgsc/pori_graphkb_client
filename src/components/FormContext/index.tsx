import React from 'react';

/**
 * @typedef FormContext
 * Passes user values to wrapped consumers.
 *
 * @property {Object} formContent the content/values by field names of the current form
 * @property {Object.<string,Object>} formErrors the form errors by field names
 * @property {bool} formHasErrors true when there are any errors in the form
 * @property {bool} formIsDirty true when the form has been changed from the initial value
 * @property {function} updateField update a single field
 * @property {function} updateFieldEvent update a single field using a synthetic event
 * @property {function} update update multiple form values
 * @property {function} replaceContent relace the form content
 * @property {string} formVariant the variant of the form (ex. view)
 * @property {function} setFormIsDirty setter for setting the formIsDirty property
 */
const FormContext = React.createContext({
  formContent: {},
  formErrors: {},
  formHasErrors: false,
  updateField: () => {},
  update: () => {},
  formIsDirty: false,
  setFormIsDirty: () => {},
  replaceContent: () => {},
  updateFieldEvent: () => {},
  formVariant: '',
});

const withFormContext = (Child) => (props) => (
  <FormContext.Consumer>
    {(values) => (
      <Child
        {...values}
        {...props}
      />
    )}
  </FormContext.Consumer>
);

export {
  withFormContext,
};

export default FormContext;
