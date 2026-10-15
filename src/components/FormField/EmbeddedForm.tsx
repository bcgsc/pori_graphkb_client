import {
  Button,
  FormHelperText,
  FormLabel,
  List,
} from '@mui/material';
import React, { ReactNode } from 'react';

import FormLayout from '@/components/FormLayout';
import {
  FormContext, FormContextState, useEmbeddedForm, useFormContext,
} from '@/components/hooks/useSchemaForm';

interface EmbeddedFormProps {
  /** the form field name to pass up to the change handler */
  name: string;
  /** change handler */
  onChange: FormContextState['updateFieldEvent'];
  /** flag to indicate this field is disabled */
  disabled?: boolean;
  /** text to be displayed below the input field */
  helperText?: string;
  /**  label to display above the field */
  label?: string;
  /** the initial value */
  value?: Record<string, unknown>;
  required?: boolean;
  readOnly?: boolean;
  /** if linked class is abstract and value does not specify class, this is the class to default to */
  defaultLinkedClass: string | undefined;
}

const EmbeddedForm = ({
  disabled = false,
  helperText,
  name,
  onChange,
  required,
  readOnly,
  value,
  label,
  defaultLinkedClass,
}: EmbeddedFormProps) => {
  const parentForm = useFormContext();
  const propModel = parentForm.model.properties[name];
  const embeddedForm = useEmbeddedForm(name, defaultLinkedClass);

  let content: ReactNode = null;

  if (!value && propModel.nullable && !readOnly && !required) {
    content = (
      <Button
        disabled={disabled}
        onClick={() => onChange({ target: { name, value: { '@class': embeddedForm.model.name } } })}
      >
        Add
      </Button>
    );
  } else {
    content = (
      <FormContext.Provider value={embeddedForm}>
        <FormLayout
          collapseExtra={false}
          disabled={disabled}
        />
      </FormContext.Provider>
    );

    if (propModel.nullable && !readOnly && value && !required) {
      content = (
        <>
          {content}
          <Button
            disabled={disabled}
            onClick={() => onChange({ target: { name, value: null } })}
          >
            Remove
          </Button>
        </>
      );
    }
  }

  return (
    <List className="form-layout__content-subgroup" sx={{ p: 1 }}>
      <FormLabel required={required}>{label}</FormLabel>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
      {content}
    </List>
  );
};

export default EmbeddedForm;
