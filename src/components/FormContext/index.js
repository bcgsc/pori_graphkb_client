import React from 'react';


/**
 * Passes user values to wrapped consumers.
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

const withFormContext = Child => props => (
  <FormContext.Consumer>
    {values => (
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
