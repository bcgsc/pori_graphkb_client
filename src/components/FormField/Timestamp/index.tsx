import { TextField } from '@material-ui/core';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

function Timestamp({
  value, name, onChange, ...rest
}) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value) { setDisplayValue(format(new Date(value), 'yyyy-MM-dd\'T\'HH:mm')); }
  }, [value]);

  const onDatePicked = ({ target: { value: eventValue } }) => {
    onChange({ target: { name, value: new Date(eventValue).getTime() } });
  };

  return (
    <TextField
      {...rest}
      className="text-field"
      InputLabelProps={{ shrink: true }}
      inputProps={{ ...(rest.inputProps || {}), 'data-testid': name }}
      name={name}
      onChange={onDatePicked}
      type="datetime-local"
      value={displayValue}
    />
  );
}

Timestamp.propTypes = {
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.any,
};
Timestamp.defaultProps = {
  value: '',
};

export default Timestamp;
