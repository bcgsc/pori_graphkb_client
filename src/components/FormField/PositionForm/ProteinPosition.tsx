import './index.scss';

import { schema, validateProperty } from '@bcgsc-pori/graphkb-schema';
import {
  TextField,
} from '@mui/material';
import React, { useCallback, useMemo } from 'react';

import FieldWrapper from '../FieldWrapper';

const {
  properties: { pos: posProperty, refAA: refAAProperty }, name: VARIANT,
} = schema.get('ProteinPosition');

interface Value {
  '@class'?: string;
  pos?: number;
  refAA?: string;
}

interface ProteinPositionProps {
  /** change handler */
  onChange?: (arg: { target: { name?: string; value: Value } }) => unknown;
  /** the initial value */
  value: Value;
  /** flag to indicate this field is disabled */
  disabled?: boolean;
  /** the form field name to pass up to the change handler */
  name?: string;
  /** flag to indicate this field must be filled */
  required?: boolean;
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
}: ProteinPositionProps) => {
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
          disabled={disabled}
          error={Boolean(refAAError)}
          helperText={refAAError || ''}
          InputLabelProps={{ shrink: Boolean(refAA) }}
          inputProps={{ 'data-testid': `${name}.refAA` }}
          label="refAA"
          name="refAA"
          onChange={handleRefAAChange}
          required={required && refAAProperty.mandatory}
          value={refAA}
        />
      </FieldWrapper>
      <FieldWrapper>
        <TextField
          className="position-form__position"
          disabled={disabled}
          error={Boolean(positionError)}
          helperText={positionError || ''}
          InputLabelProps={{ shrink: Boolean(position) }}
          inputProps={{ 'data-testid': `${name}.pos` }}
          label="position"
          name="pos"
          onChange={handlePositionChange}
          required={required && posProperty.mandatory}
          value={position}
        />
      </FieldWrapper>
    </>
  );
};

export default ProteinPosition;
