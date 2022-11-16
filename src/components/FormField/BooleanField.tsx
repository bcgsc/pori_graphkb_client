import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
} from '@material-ui/core';
import React from 'react';

interface BooleanFieldProps {
  /** the name of the field used in propogating events */
  name: string;
  /** the function handler for changes */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** flag to indicate the user cannot change this field */
  disabled?: boolean;
  /** flag to indicate there has been an error filling this field */
  error?: boolean;
  helperText?: string;
  /** the field label */
  label?: string;
  /** flag to indicate this field must be filled */
  required?: boolean;
  /** the current value */
  value?: unknown;
}

/**
 * RadioForm Field for a boolean form fieldset
 */
const BooleanField = (props: BooleanFieldProps) => {
  const {
    disabled,
    error,
    label,
    name,
    onChange,
    required,
    helperText,
    value: initialValue,
    ...rest
  } = props;
  const value = initialValue === undefined || initialValue === null
    ? null
    : initialValue.toString();

  return (
    <div
      className="form-templater-radio-wrapper"
      {...rest}
    >
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
          onChange={(e) => onChange(e)}
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

BooleanField.defaultProps = {
  disabled: false,
  error: false,
  label: '',
  required: false,
  helperText: '',
  value: undefined,
};

export default BooleanField;
