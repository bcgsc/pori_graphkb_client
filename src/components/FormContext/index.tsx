import React from 'react';

import { GeneralRecordType } from '../types';
import { FORM_VARIANT } from '../util';

export interface FormContextState<R = Partial<GeneralRecordType>> {
  formContent: R;
  formErrors: Record<string, { message?: string; }>;
  formHasErrors: boolean;
  updateField: (propName: string, propValue: unknown) => void;
  update: () => void;
  formIsDirty: boolean;
  setFormIsDirty: (isDirty: boolean) => void;
  replaceContent?: () => void;
  updateFieldEvent: (event: { target: { name: string; value: unknown } }) => void;
  formVariant: FORM_VARIANT | '';
  additionalValidationError?: string;
}

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
const FormContext = React.createContext<FormContextState>({
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
