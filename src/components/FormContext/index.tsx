import React from 'react';

import { GeneralRecordType } from '../types';
import { FORM_VARIANT } from '../util';

export interface FormContextState {
  /** the content/values by field names of the current form */
  formContent: GeneralRecordType;
  /** the form errors by field names */
  formErrors: Partial<Record<string, { message: string } | null>>;
  /** true when there are any errors in the form */
  formHasErrors: boolean;
  /** true when the form has been changed from the initial value */
  formIsDirty: boolean;
  additionalValidationError: string;
  /** update a single field */
  updateField: (name: string, value: unknown) => void;
  /** update a single field using a synthetic event */
  updateFieldEvent: (event: { target: { name: string; value: unknown } }) => void;
  /** update multiple form values */
  update: (record: Partial<GeneralRecordType>) => void;
  /** replace the form content */
  replaceContent: (record: GeneralRecordType) => void;
  /** the variant of the form (ex. view) */
  formVariant: FORM_VARIANT | '';
  /** setter for setting the formIsDirty property */
  setFormIsDirty: (dirty: boolean) => void;
}

const FormContext = React.createContext<FormContextState>({
  formContent: {},
  formErrors: {},
  formHasErrors: false,
  formIsDirty: false,
  formVariant: '',
  additionalValidationError: '',
  setFormIsDirty: () => {},
  update: () => {},
  updateField: () => {},
  updateFieldEvent: () => {},
  replaceContent: () => {},
});

export default FormContext;
