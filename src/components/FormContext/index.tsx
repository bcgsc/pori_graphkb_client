import React, { useContext } from 'react';

import { SchemaPropertyDefinition } from '@/services/schema';

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
  /** the variant of the form (ex. view) */
  formVariant: FORM_VARIANT | '';
  /** setter for setting the formIsDirty property */
  setFormIsDirty: (dirty: boolean) => void;
  model: {
    name?: string;
    properties: Record<string, Partial<SchemaPropertyDefinition> & {
      name: string;
    }>;
    isEdge?: boolean;
  }
}

const FormContext = React.createContext<FormContextState | null>(null);

export const useFormContext = () => {
  const value = useContext(FormContext);

  if (!value) {
    throw new Error('missing FormContext provider');
  }
  return value;
};

export default FormContext;
