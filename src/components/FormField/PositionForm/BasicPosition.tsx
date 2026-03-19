import './index.scss';

import { schema as schemaDefn, validateProperty } from '@bcgsc-pori/graphkb-schema';
import {
  TextField,
} from '@mui/material';
import React, { useCallback, useMemo } from 'react';

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
  const { pos: position, offset } = value || {};

  // validate the position input
  const positionError = useMemo(() => {
    if (!position && required && posProperty.mandatory) {
      return 'missing required property';
    }

    try {
      validateProperty(posProperty, position);
      return '';
    } catch (err) {
      return (err as Error).toString();
    }
  }, [position, required]);

  // validate the offset input
  const offsetError = useMemo(() => {
    if (!offset && offset !== 0) {
      if (required && offsetProperty.mandatory) {
        return 'missing required property';
      }
      return '';
    }

    try {
      validateProperty(offsetProperty, offset);
      return '';
    } catch (err) {
      return (err as Error).toString();
    }
  }, [offset, required]);

  const handlePositionChange = useCallback(({ target: { value: newValue } }) => {
    onChange?.({ target: { name, value: { '@class': variant, pos: newValue, offset } } });
  }, [onChange, name, variant, offset]);

  const handleOffsetChange = useCallback(({ target: { value: newValue } }) => {
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
          InputLabelProps={{ shrink: !!position }}
          inputProps={{ 'data-testid': `${name}.pos` }}
          label="position"
          name="pos"
          onChange={handlePositionChange}
          required={required}
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
            InputLabelProps={{ shrink: offset !== '' }}
            inputProps={{ 'data-testid': `${name}.offset` }}
            label="offset"
            name="offset"
            onChange={handleOffsetChange}
            required={required}
            value={offset}
          />
        </FieldWrapper>
      )}
    </>
  );
};

export default BasicPositionForm;
