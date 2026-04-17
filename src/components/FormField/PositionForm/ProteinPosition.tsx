import './index.scss';

import { schema, validateProperty } from '@bcgsc-pori/graphkb-schema';
import {
  TextField,
} from '@mui/material';
import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';

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
  readOnly?: boolean;
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
}: ProteinPositionProps) => {
  const { pos: initialPos, refAA: initialRefAA } = value || {};
  const [position, setPosition] = useState(initialPos);
  const [refAA, setRefAA] = useState(initialRefAA);

  useEffect(() => {
    setPosition(value?.pos);
    setRefAA(value?.refAA);
  }, [value]);

  // validate the position input
  const positionError = useMemo(() => {
    if (!position && required && posProperty.mandatory) {
      return 'missing required field';
    }

    try {
      validateProperty(posProperty, position || null);
    } catch (err) {
      return (err as Error).toString();
    }

    return '';
  }, [position, required]);

  // validate the offset input
  const refAAError = useMemo(() => {
    if (!refAA && required && refAAProperty.mandatory) {
      return 'missing required field';
    }

    try {
      validateProperty(refAAProperty, refAA || null);
    } catch (err) {
      return (err as Error).toString();
    }

    return '';
  }, [refAA, required]);

  const handlePositionChange = useCallback(({ target: { value: newValue } }) => {
    if (readOnly) return;
    setPosition(newValue);
    onChange?.({ target: { name, value: { '@class': VARIANT, pos: newValue, refAA } } });
  }, [readOnly, onChange, name, refAA]);

  const handleRefAAChange = useCallback(({ target: { value: newValue } }) => {
    if (readOnly) return;
    setRefAA(newValue);
    onChange?.({ target: { name, value: { '@class': VARIANT, refAA: newValue, pos: position } } });
  }, [readOnly, onChange, name, position]);

  return (
    <>
      <FieldWrapper>
        <TextField
          className="position-form__refaa"
          disabled={disabled}
          error={Boolean(refAAError)}
          helperText={refAAError || ''}
          label="refAA"
          name="refAA"
          onChange={!readOnly ? handleRefAAChange : undefined}
          required={required && refAAProperty.mandatory}
          slotProps={{
            inputLabel: { shrink: Boolean(refAA) },
            htmlInput: { 'data-testid': `${name}.refAA` },
            input: { readOnly, disableUnderline: readOnly },
          }}
          value={refAA ?? ''}
        />
      </FieldWrapper>
      <FieldWrapper>
        <TextField
          className="position-form__position"
          disabled={disabled}
          error={Boolean(positionError)}
          helperText={positionError || ''}
          label="position"
          name="pos"
          onChange={!readOnly ? handlePositionChange : undefined}
          required={required && posProperty.mandatory}
          slotProps={{
            inputLabel: { shrink: Boolean(position) },
            htmlInput: { 'data-testid': `${name}.pos` },
            input: { readOnly, disableUnderline: readOnly },
          }}
          value={position ?? ''}
        />
      </FieldWrapper>
    </>
  );
};

export default ProteinPosition;
