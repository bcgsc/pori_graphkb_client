import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
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
    value: initialValue,
  } = props;
  const value = initialValue === undefined || initialValue === null
    ? null
    : initialValue.toString();

  return (
    <div>
      <FormControl
        component="fieldset"
        disabled={disabled}
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
          <FormControlLabel control={<Radio checked={value === 'true'} />} label="Yes" value="true" />
          <FormControlLabel control={<Radio checked={value === 'false'} />} label="No" value="false" />
        </RadioGroup>
        {helperText && (<FormHelperText>{helperText}</FormHelperText>)}
      </FormControl>
    </div>
  );
};

export default BooleanField;
