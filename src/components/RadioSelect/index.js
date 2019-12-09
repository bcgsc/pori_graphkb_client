/**
 * RadioList based selection
 */
import './index.scss';

import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';


/**
 * Select from a list of radio button options
 *
 * Add captions below choices when provided
 *
 * @param {object} props
 * @param {Array.<string|object>} props.options the options to display
 * @param {function} props.onChange the change handler to report the selection back to the parent
 * @param {string} props.className css class name to add to the top-level component
 * @param {string} props.label optional label for the field
 * @param {any} props.value the current value
 * @param {function} props.optionToKey the function to generate a key from a selection value
 * @param {string} props.name the name to use for the input and reporting change to the parent handler
 */
const RadioSelect = ({
  options, onChange, className, label, value, optionToKey, name,
}) => (
  <FormControl className={`radio-select ${className}`} component="fieldset">
    {label && (<FormLabel component="legend">{label}</FormLabel>)}
    <RadioGroup name={name} onChange={onChange} value={value}>
      {options.map(option => (
        <FormControl key={optionToKey(option)} className="radio-option">
          <FormControlLabel
            control={<Radio inputProps={{ 'data-testid': `radio-option__${optionToKey(option)}` }} />}
            label={option.label || option}
            value={option.value || option}
          />
          {option && option.caption && (
            <Typography className="radio-option__description" variant="body2">
              {option.caption}
            </Typography>
          )}
        </FormControl>
      ))}
    </RadioGroup>
  </FormControl>
);


RadioSelect.propTypes = {
  options: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string, PropTypes.shape({ label: PropTypes.string, value: PropTypes.any }),
  ])).isRequired,
  className: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func,
  optionToKey: PropTypes.func,
  value: PropTypes.any,
};

RadioSelect.defaultProps = {
  label: '',
  name: '',
  onChange: () => {},
  className: '',
  value: null,
  optionToKey: o => o.key || o,
};

export default RadioSelect;
