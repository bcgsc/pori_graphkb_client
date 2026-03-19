import './index.scss';

import { schema as schemaDefn, validateProperty } from '@bcgsc-pori/graphkb-schema';
import {
  TextField,
} from '@mui/material';
import React, { useCallback, useMemo } from 'react';

import FieldWrapper from '../FieldWrapper';
import { BaseFormFieldProps } from '../types';

const { pos: posProperty } = schemaDefn.getProperties('GenomicPosition');
const { offset: offsetProperty } = schemaDefn.getProperties('CdsPosition');

interface BasicPositionFormProps extends BaseFormFieldProps<{
  pos?: number;
  offset?: number | '';
  '@class'?: string;
}> {
  /** the class model to use to build the form */
  variant: 'GenomicPosition' | 'ExonicPosition' | 'IntronicPosition' | 'RnaPosition' | 'CdsPosition';
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
          disabled={disabled && !readOnly}
          error={Boolean(positionError)}
          helperText={positionError || ''}
          label="position"
          name="pos"
          onChange={handlePositionChange}
          required={required}
          slotProps={{
            inputLabel: { shrink: !!position },
            htmlInput: { 'data-testid': `${name}.pos` },
            input: { readOnly },
          }}
          value={position}
        />
      </FieldWrapper>
      {isOffsetVariant && (
        <FieldWrapper>
          <TextField
            className="position-form__offset form-field"
            disabled={disabled && !readOnly}
            error={Boolean(offsetError)}
            helperText={offsetError || ''}
            label="offset"
            name="offset"
            onChange={handleOffsetChange}
            required={required}
            slotProps={{
              inputLabel: { shrink: offset !== '' },
              htmlInput: { 'data-testid': `${name}.offset` },
              input: { readOnly },
            }}
            value={offset}
          />
        </FieldWrapper>
      )}
    </>
  );
};

export default BasicPositionForm;
