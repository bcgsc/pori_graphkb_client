import { TextField, TextFieldProps } from '@mui/material';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';

import { FormContextState } from '@/components/FormContext';

interface TimestampProps extends Pick<TextFieldProps, 'disabled' | 'error' | 'helperText' | 'label' | 'required'> {
  name: string;
  onChange: FormContextState['updateFieldEvent'];
  value?: any;
  readOnly?: boolean;
}

const Timestamp = ({
  value = '', name, onChange, disabled,
  helperText, error, label, required, readOnly,
}: TimestampProps) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value) { setDisplayValue(format(new Date(value), 'yyyy-MM-dd\'T\'HH:mm')); }
  }, [value]);

  const onDatePicked = ({ target: { value: eventValue } }) => {
    onChange({ target: { name, value: new Date(eventValue).getTime() } });
  };

  return (
    <TextField
      className="text-field"
      disabled={disabled}
      error={error}
      helperText={helperText}
      label={label}
      name={name}
      onChange={!readOnly ? onDatePicked : undefined}
      required={required}
      slotProps={{
        inputLabel: { shrink: true },
        htmlInput: { 'data-testid': name },
        input: { readOnly, disableUnderline: readOnly },
      }}
      type="datetime-local"
      value={displayValue}
    />
  );
};

export default Timestamp;
