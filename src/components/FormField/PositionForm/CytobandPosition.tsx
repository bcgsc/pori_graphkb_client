import './index.scss';

import { schema } from '@bcgsc-pori/graphkb-schema';
import {
  TextField,
} from '@mui/material';
import React, { useCallback } from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';

import useSchemaForm from '@/components/hooks/useSchemaForm';

import FieldWrapper from '../FieldWrapper';
import { BaseFormFieldProps } from '../types';

const {
  properties,
  properties: { arm, majorBand, minorBand }, name: VARIANT,
} = schema.get('CytobandPosition');

type CytobandPositionProps = BaseFormFieldProps<Record<string, unknown>>;

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
    onChange?.({ target: { name, value: formContent } });
  }, [formContent]);

  const handleUpdate = useCallback(({ target: { name: eventName, value: eventValue } }) => {
    updateField(eventName, eventValue);
  }, [updateField]);

  return (
    <>
      {[arm, majorBand, minorBand].map((model) => (
        <FieldWrapper key={model.name}>
          <TextField
            disabled={disabled && !readOnly}
            error={Boolean(formErrors[model.name])}
            helperText={(formErrors[model.name] && formErrors[model.name].message) || ''}
            label={model.name}
            name={model.name}
            onChange={handleUpdate}
            required={required && model.mandatory}
            slotProps={{
              htmlInput: { 'data-testid': `${name}.${model.name}` },
              inputLabel: { shrink: Boolean(formContent[model.name]) },
              input: { readOnly },
            }}
            value={formContent[model.name]}
          />
        </FieldWrapper>
      ))}
    </>
  );
};

export default CytobandPosition;
