/**
 * RadioList based selection
 */
import './index.scss';

import {
  FormLabel,
  ListItemText,
  MenuItem,
  MenuList,
  Radio,
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
  <MenuList className={`radio-select ${className}`}>
    {label && (<FormLabel>{label}</FormLabel>)}
    {options.map((option) => {
      const optionValue = option.value === undefined ? option : option.value;
      const checked = Boolean(value === optionValue);
      return (
        <MenuItem
          key={optionToKey(option)}
          className="radio-option"
          onClick={() => {
            onChange({ target: { name, value: optionValue } });
          }}
          selected={checked}
          value={optionValue}
        >
          <Radio checked={checked} inputProps={{ 'data-testid': `radio-option__${optionToKey(option)}` }} />
          <ListItemText
            primary={option.label || option}
            primaryTypographyProps={{ className: 'radio-option__title' }}
            secondary={option.caption || ''}
            secondaryTypographyProps={{ className: 'radio-option__caption' }}
          />
        </MenuItem>
      );
    })}
  </MenuList>
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
