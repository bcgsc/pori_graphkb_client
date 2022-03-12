import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * RadioForm Field for a boolean form fieldset
 *
 * @param {object} props
 * @param {boolean} props.disabled flag to indicate the user cannot change this field
 * @param {boolean} props.error flag to indicate there has been an error filling this field
 * @param {string} props.label the field label
 * @param {string} props.name the name of the field used in propogating events
 * @param {function} props.onChange the function handler for changes
 * @param {boolean} props.required flag to indicate this field must be filled
 * @param {string|boolean} props.value the current value
 */
const BooleanField = (props) => {
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
          onChange={e => onChange(e)}
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

BooleanField.propTypes = {
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
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
