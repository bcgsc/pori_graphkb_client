import React from 'react';
import {
  FormControl,
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormHelperText,
} from '@material-ui/core';
import PropTypes from 'prop-types';


/**
 * RadioForm Field for a boolean form fieldset
 *
 * @param {object} props
 * @param {boolean} props.disabled flag to indicate the user cannot change this field
 * @param {boolean} props.error flag to indicate there has been an error filling this field
 * @param {string} props.label the field label
 * @param {string} props.name the name of the field used in propogating events
 * @param {function} props.onValueChange the function handler for changes
 * @param {boolean} props.required flag to indicate this field must be filled
 * @param {string|boolean} props.value the current value
 */
const BooleanField = (props) => {
  const {
    disabled,
    error,
    label,
    name,
    onValueChange,
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
        {helperText && (<FormHelperText>{helperText}</FormHelperText>)}
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
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  helperText: PropTypes.string,
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
