import './index.scss';

import { schema, validateProperty } from '@bcgsc-pori/graphkb-schema';
import {
  TextField,
} from '@mui/material';
import React, { useCallback, useMemo } from 'react';

import FieldWrapper from '../FieldWrapper';
import { BaseFormFieldProps } from '../types';

const {
  properties: { pos: posProperty, refAA: refAAProperty }, name: VARIANT,
} = schema.get('ProteinPosition');

interface Value {
  '@class'?: string;
  pos?: number;
  refAA?: string;
}

/**
 * Protein Position Input form
 */
const ProteinPosition = ({
  onChange,
  value,
  name = '',
  required = true,
  disabled = false,
  readOnly,
}: BaseFormFieldProps<Value>) => {
  const { pos: position, refAA } = value || {};

  // validate the position input
  const positionError = useMemo(() => {
    if (!position && required && posProperty.mandatory) {
      return 'missing required field';
    }

    try {
      validateProperty(posProperty, position || null);
      return '';
    } catch (err) {
      return (err as Error).toString();
    }
  }, [position, required]);

  // validate the offset input
  const refAAError = useMemo(() => {
    if (!refAA && required && refAAProperty.mandatory) {
      return 'missing required field';
    }

    try {
      validateProperty(refAAProperty, refAA || null);
      return '';
    } catch (err) {
      return (err as Error).toString();
    }
  }, [refAA, required]);

  const handlePositionChange = useCallback(({ target: { value: newValue } }) => {
    onChange?.({ target: { name, value: { '@class': VARIANT, pos: newValue, refAA } } });
  }, [onChange, name, refAA]);

  const handleRefAAChange = useCallback(({ target: { value: newValue } }) => {
    onChange?.({ target: { name, value: { '@class': VARIANT, refAA: newValue, pos: position } } });
  }, [onChange, name, position]);

  return (
    <>
      <FieldWrapper>
        <TextField
          className="position-form__refaa"
          disabled={disabled && !readOnly}
          error={Boolean(refAAError)}
          helperText={refAAError || ''}
          label="refAA"
          name="refAA"
          onChange={handleRefAAChange}
          required={required && refAAProperty.mandatory}
          slotProps={{
            inputLabel: { shrink: Boolean(refAA) },
            htmlInput: { 'data-testid': `${name}.refAA` },
            input: { readOnly },
          }}
          value={refAA}
        />
      </FieldWrapper>
      <FieldWrapper>
        <TextField
          className="position-form__position"
          disabled={disabled && !readOnly}
          error={Boolean(positionError)}
          helperText={positionError || ''}
          label="position"
          name="pos"
          onChange={handlePositionChange}
          required={required && posProperty.mandatory}
          slotProps={{
            inputLabel: { shrink: Boolean(position) },
            htmlInput: { 'data-testid': `${name}.pos` },
            input: { readOnly },
          }}
          value={position}
        />
      </FieldWrapper>
    </>
  );
};

export default ProteinPosition;
