import { TextField, TextFieldProps } from '@mui/material';
import { format } from 'date-fns';
import React, { useMemo } from 'react';

import { BaseFormFieldProps } from '../types';

interface TimestampProps extends BaseFormFieldProps<any>, Pick<TextFieldProps, 'inputProps' | 'multiline' | 'rows' | 'variant'> {
}

const Timestamp = ({
  value = '', name = '', onChange, errorText, helperText, readOnly, inputProps, disabled, ...rest
}: TimestampProps) => {
  const displayValue = useMemo(
    () => (value ? format(new Date(value), 'yyyy-MM-dd\'T\'HH:mm') : ''),
    [value],
  );

  const onDatePicked = ({ target: { value: eventValue } }) => {
    onChange?.({ target: { name, value: new Date(eventValue).getTime() } });
  };

  return (
    <TextField
      {...rest}
      className="text-field"
      disabled={disabled && !readOnly}
      helperText={errorText || helperText}
      name={name}
      onChange={onDatePicked}
      slotProps={{
        input: { readOnly, disableUnderline: disabled || readOnly },
        inputLabel: { shrink: true },
        htmlInput: { ...(inputProps || {}), 'data-testid': name },
      }}
      type="datetime-local"
      value={displayValue}
    />
  );
};

export default Timestamp;
