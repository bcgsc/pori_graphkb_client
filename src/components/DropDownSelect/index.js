/**
 * @module /components/DropDownSelect
 */
import './index.scss';

import {
  FilledInput,
  FormControl,
  FormHelperText,
  Input,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
} from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import PropTypes from 'prop-types';
import React from 'react';

import { GeneralRecordPropType } from '@/components/types';


const DefaultOptionComponent = (option, disabled) => (
  <MenuItem
    key={
        option.key === undefined
          ? option
          : option.key
      }
    className="option-select__option"
    component="li"
    value={
        option.value === undefined
          ? option
          : option.value
      }
  >
    <ListItemText
      classes={{
        primary: disabled ? 'disabled-text' : '',
        multiline: option.caption ? 'margin-reset' : '',
        root: option.caption ? 'margin-reset' : '',
      }}
      primary={
          option.label === undefined
            ? option || 'None'
            : option.label
        }
      secondary={option.caption || ''}
      secondaryTypographyProps={{ className: 'option-select__option-description' }}
    />
  </MenuItem>
);

/**
 * Component to select options from a list of defined options.
 * @param {Object} props - Properties passed in by parent component.
 */
function DropDownSelect(props) {
  const {
    options,
    value,
    onChange,
    name,
    label,
    children,
    required,
    id,
    innerProps,
    error,
    helperText,
    dense,
    variant,
    className,
    disabled,
    IconComponent,
  } = props;

  const optionsDisplay = options.map(option => children(option, disabled));

  let InputComponent = Input;

  if (variant === 'outlined') {
    InputComponent = OutlinedInput;
  }
  if (variant === 'filled') {
    InputComponent = FilledInput;
  }
  return (
    <FormControl
      className={`option-select ${className}`}
      disabled={disabled}
      error={error}
      id={id}
      variant={variant}
    >
      <InputLabel
        htmlFor={`option-select-${name}`}
        required={required}
        style={{
          fontSize: dense ? '0.8125rem' : '',
        }}
      >
        {label}
      </InputLabel>
      <Select
        IconComponent={disabled
          ? 'span'
          : IconComponent
        }
        input={<InputComponent id={`option-select-${name}`} name={name} />}
        inputProps={innerProps}
        onChange={onChange}
        style={{
          fontSize: dense ? '0.8125rem' : '',
        }}
        value={value || ''}
      >
        {optionsDisplay}
      </Select>
      <FormHelperText>{helperText}</FormHelperText>
    </FormControl>
  );
}

const SelectOptionPropType = PropTypes.shape({
  key: PropTypes.string,
  value: PropTypes.string,
  label: PropTypes.string,
  caption: PropTypes.string,
});


/**
 * @namespace
 * @property {Array.<any>} options - List of options to be selected from.
 * @property {any} value - Parent property to bind output data to.
 * @property {function} onChange - Parent function to trigger on item select.
 * @property {string} name - DOM node name property.
 * @property {string} label - Component label text.
 * @property {function} children - Function to produce list items.
 * @property {boolean} required - Required flag for input component.
 * @property {boolean} error - Error flag for input component.
 * @property {string} id - CSS selector id for root component.
 * @property {boolean} dense - Flag for dense variant, which has smaller font
 * size.
 * @property {string} variant - Material UI Select variant (outlined, filled, standard)
 */

DropDownSelect.propTypes = {
  IconComponent: PropTypes.element,
  children: PropTypes.func,
  className: PropTypes.string,
  dense: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  id: PropTypes.string,
  innerProps: PropTypes.object,
  label: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(PropTypes.oneOfType([SelectOptionPropType, PropTypes.string])),
  required: PropTypes.bool,
  value: PropTypes.oneOfType([GeneralRecordPropType, PropTypes.string]),
  variant: PropTypes.string,
};

DropDownSelect.defaultProps = {
  children: DefaultOptionComponent,
  options: [],
  onChange: null,
  name: '',
  label: '',
  required: false,
  error: false,
  id: undefined,
  dense: false,
  variant: 'standard',
  className: '',
  disabled: false,
  helperText: '',
  innerProps: {},
  value: null,
  IconComponent: ArrowDropDownIcon,
};

export default DropDownSelect;
