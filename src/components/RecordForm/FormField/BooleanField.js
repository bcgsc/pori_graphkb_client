import React from 'react';
import {
  FormControl,
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
} from '@material-ui/core';
import PropTypes from 'prop-types';


const BooleanField = (props) => {
  const {
    disabled,
    error,
    label,
    name,
    onValueChange,
    required,
    ...rest
  } = props;
  const value = props.value === undefined || props.value === null
    ? null
    : props.value.toString();

  return (
    <div
      className="form-templater-radio-wrapper"
      {...rest}
    >
      <FormControl
        component="fieldset"
        required={required}
        error={error}
        disabled={disabled}
      >
        <FormLabel>
          {label || name}
        </FormLabel>
        <RadioGroup
          name={name}
          onChange={e => onValueChange(e)}
          value={value}
          style={{ flexDirection: 'row' }}
        >
          <FormControlLabel value="true" control={<Radio checked={value === 'true'} />} label="Yes" />
          <FormControlLabel value="false" control={<Radio checked={value === 'false'} />} label="No" />
        </RadioGroup>
      </FormControl>
    </div>
  );
};

BooleanField.propTypes = {
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  onValueChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  value: PropTypes.string,
};

BooleanField.defaultProps = {
  disabled: false,
  error: false,
  label: '',
  required: false,
  value: undefined,
};

export default BooleanField;
