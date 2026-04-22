import './index.scss';

import { schema } from '@bcgsc-pori/graphkb-schema';
import {
  TextField,
} from '@mui/material';
import React, { useCallback } from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';

import useSchemaForm from '@/components/hooks/useSchemaForm';

import FieldWrapper from '../FieldWrapper';

const {
  properties,
  properties: { arm, majorBand, minorBand }, name: VARIANT,
} = schema.get('CytobandPosition');

interface CytobandPositionProps {
  /** change handler */
  onChange: (arg: { target: { name?: string; value: unknown } }) => void;
  /** flag to indicate this field is disabled */
  disabled?: boolean;
  /** the form field name to pass up to the change handler */
  name?: string;
  /** flag to indicate this field must be filled */
  required?: boolean;
  /** the initial value */
  value?: Record<string, unknown>;
  readOnly?: boolean;
}

/**
 * Cytoband position form
 */
const CytobandPosition = ({
  onChange,
  value = {},
  name = '',
  required = true,
  disabled = false,
  readOnly,
}: CytobandPositionProps) => {
  const { formContent, formErrors, updateField } = useSchemaForm(
    properties,
    { ...(value || {}), '@class': VARIANT },
  );

  useDeepCompareEffect(() => {
    if (readOnly) return;
    onChange({ target: { name, value: formContent } });
  }, [formContent, readOnly]);

  const handleUpdate = useCallback(({ target: { name: eventName, value: eventValue } }) => {
    if (readOnly) return;
    updateField(eventName, eventValue);
  }, [updateField, readOnly]);

  return (
    <>
      {[arm, majorBand, minorBand].map((model) => (
        <FieldWrapper key={model.name}>
          <TextField
            disabled={disabled}
            error={Boolean(formErrors[model.name])}
            helperText={(formErrors[model.name] && formErrors[model.name].message) || ''}
            label={model.name}
            name={model.name}
            onChange={handleUpdate}
            required={required && model.mandatory}
            slotProps={{
              inputLabel: { shrink: Boolean(formContent[model.name]) },
              htmlInput: { 'data-testid': `${name}.${model.name}` },
              input: { readOnly, disableUnderline: readOnly },
            }}
            value={formContent[model.name]}
          />
        </FieldWrapper>
      ))}
    </>
  );
};

export default CytobandPosition;
