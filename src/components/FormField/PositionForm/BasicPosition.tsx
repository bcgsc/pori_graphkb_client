import './index.scss';

import { schema as schemaDefn, validateProperty } from '@bcgsc-pori/graphkb-schema';
import {
  TextField,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import FieldWrapper from '../FieldWrapper';

const { pos: posProperty } = schemaDefn.getProperties('GenomicPosition');
const { offset: offsetProperty } = schemaDefn.getProperties('CdsPosition');

interface BasicPositionFormProps {
  /** change handler */
  onChange?: (...args: unknown[]) => unknown;
  /** the class model to use to build the form */
  variant: 'GenomicPosition' | 'ExonicPosition' | 'IntronicPosition' | 'RnaPosition' | 'CdsPosition';
  /** flag to indicate this field is disabled */
  disabled?: boolean;
  /** the form field name to pass up to the change handler */
  name?: string;
  /** flag to indicate this field must be filled */
  required?: boolean;
  /** the initial value */
  value?: {
    pos?: number;
    offset?: number | '';
  },
}

/**
 * Basic Position and Position with offset form
 */
const BasicPositionForm = ({
  onChange,
  variant,
  value,
  name = '',
  required = true,
  disabled = false,
}: BasicPositionFormProps) => {
  const { pos: initialPos, offset: initialOffset } = value || {};
  const [position, setPosition] = useState(initialPos);
  const [positionError, setPositionError] = useState('');
  const [offset, setOffset] = useState(initialOffset);
  const [offsetError, setOffsetError] = useState('');

  useEffect(() => {
    setPosition(value?.pos);
    setOffset(value?.offset);
  }, [value]);

  // validate the position input
  useEffect(() => {
    if (!position && required && posProperty.mandatory) {
      setPositionError('missing required property');
    } else {
      try {
        validateProperty(posProperty, position);
        setPositionError('');
      } catch (err) {
        setPositionError((err as Error).toString());
      }
    }
  }, [position, required]);

  // validate the offset input
  useEffect(() => {
    if (!offset && offset !== 0) {
      if (required && offsetProperty.mandatory) {
        setOffsetError('missing required property');
      } else {
        setOffsetError('');
      }
    } else {
      try {
        validateProperty(offsetProperty, offset);
        setOffsetError('');
      } catch (err) {
        setOffsetError((err as Error).toString());
      }
    }
  }, [offset, required]);

  const handlePositionChange = useCallback(({ target: { value: newValue } }) => {
    setPosition(newValue);
    onChange?.({ target: { name, value: { '@class': variant, pos: newValue, offset } } });
  }, [onChange, name, variant, offset]);

  const handleOffsetChange = useCallback(({ target: { value: newValue } }) => {
    setOffset(newValue);
    onChange?.({ target: { name, value: { '@class': variant, offset: newValue, pos: position } } });
  }, [onChange, name, variant, position]);

  const isOffsetVariant = Boolean(schemaDefn.getProperty(variant, 'offset'));

  return (
    <>
      <FieldWrapper>
        <TextField
          className="position-form__position form-field"
          disabled={disabled}
          error={Boolean(positionError)}
          helperText={positionError || ''}
          label="position"
          name="pos"
          onChange={handlePositionChange}
          required={required}
          slotProps={{
            inputLabel: { shrink: !!position },
            htmlInput: { 'data-testid': `${name}.pos` },
          }}
          value={position}
        />
      </FieldWrapper>
      {isOffsetVariant && (
        <FieldWrapper>
          <TextField
            className="position-form__offset form-field"
            disabled={disabled}
            error={Boolean(offsetError)}
            helperText={offsetError || ''}
            label="offset"
            name="offset"
            onChange={handleOffsetChange}
            required={required}
            slotProps={{
              inputLabel: { shrink: offset !== '' },
              htmlInput: { 'data-testid': `${name}.offset` },
            }}
            value={offset}
          />
        </FieldWrapper>
      )}
    </>
  );
};

export default BasicPositionForm;
