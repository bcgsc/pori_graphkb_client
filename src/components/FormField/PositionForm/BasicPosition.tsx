import './index.scss';

import { validateProperty } from '@bcgsc-pori/graphkb-schema';
import {
  TextField,
} from '@mui/material';
import React, { useCallback, useMemo } from 'react';

import schema from '@/services/schema';

import FieldWrapper from '../FieldWrapper';

const { pos: posProperty } = schema.get('GenomicPosition').properties;
const { offset: offsetProperty } = schema.get('CdsPosition').properties;

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
  readOnly?: boolean;
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
  readOnly,
}: BasicPositionFormProps) => {
  const { pos: position, offset } = value || {};

  // validate the position input
  const positionError = useMemo(() => {
    if (!position && required && posProperty.mandatory) {
      return 'missing required property';
    }

    try {
      validateProperty(posProperty, position);
    } catch (err) {
      return (err as Error).toString();
    }

    return '';
  }, [position, required]);

  // validate the offset input
  const offsetError = useMemo(() => {
    if (!offset && offset !== 0) {
      if (required && offsetProperty.mandatory) {
        return 'missing required property';
      }
    } else {
      try {
        validateProperty(offsetProperty, offset);
      } catch (err) {
        return (err as Error).toString();
      }
    }
    return '';
  }, [offset, required]);

  const handlePositionChange = useCallback(({ target: { value: newValue } }) => {
    if (readOnly) return;
    onChange?.({ target: { name, value: { '@class': variant, pos: newValue, offset } } });
  }, [readOnly, onChange, name, variant, offset]);

  const handleOffsetChange = useCallback(({ target: { value: newValue } }) => {
    if (readOnly) return;
    onChange?.({ target: { name, value: { '@class': variant, offset: newValue, pos: position } } });
  }, [onChange, name, variant, position, readOnly]);

  const isOffsetVariant = Boolean(schema.get(variant).properties.offset);

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
            input: { readOnly, disableUnderline: readOnly },
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
              input: { readOnly, disableUnderline: readOnly },
            }}
            value={offset}
          />
        </FieldWrapper>
      )}
    </>
  );
};

export default BasicPositionForm;
