import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  RadioProps,
} from '@mui/material';
import React from 'react';

import { BaseFormFieldProps } from './types';

/**
 * RadioForm Field for a boolean form fieldset
 */
const BooleanField = (props: BaseFormFieldProps<string | boolean>) => {
  const {
    disabled = false,
    error = false,
    label = '',
    name,
    onChange,
    required = false,
    helperText = '',
    errorText,
    readOnly,
    value: initialValue,
  } = props;
  const value = initialValue === undefined || initialValue === null
    ? null
    : initialValue.toString();

  const slotProps: RadioProps['slotProps'] = { input: { readOnly } };

  return (
    <div>
      <FormControl
        component="fieldset"
        disabled={disabled && !readOnly}
        error={error}
        required={required}
      >
        <FormLabel>
          {label || name}
        </FormLabel>
        <RadioGroup
          name={name}
          onChange={(e) => onChange?.(e)}
          style={{ flexDirection: 'row' }}
          value={value}
        >
          <FormControlLabel control={<Radio checked={value === 'true'} slotProps={slotProps} />} label="Yes" value="true" />
          <FormControlLabel control={<Radio checked={value === 'false'} slotProps={slotProps} />} label="No" value="false" />
        </RadioGroup>
        {(errorText || helperText) && (<FormHelperText>{errorText || helperText}</FormHelperText>)}
      </FormControl>
    </div>
  );
};

export default BooleanField;
