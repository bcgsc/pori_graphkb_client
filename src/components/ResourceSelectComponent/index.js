/**
 * @module /components/ResourceSelectComponent
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


const DefaultOptionComponent = (resource, disabled) => (
  <MenuItem
    key={resource.key || resource}
    className="resource-select__option"
    component="li"
    value={resource.value || resource}
  >
    <ListItemText
      classes={{
        primary: disabled ? 'disabled-text' : '',
        multiline: resource.caption ? 'margin-reset' : '',
        root: resource.caption ? 'margin-reset' : '',
      }}
      primary={resource.label || resource || 'None'}
      secondary={resource.caption || ''}
      secondaryTypographyProps={{ className: 'resource-select__option-description' }}
    />
  </MenuItem>
);

/**
 * Component to select resources from a list of defined options.
 * @param {Object} props - Properties passed in by parent component.
 */
function ResourceSelectComponent(props) {
  const {
    resources,
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
  } = props;

  const resourcesDisplay = resources.map(resource => children(resource, disabled));
  let InputComponent = Input;

  if (variant === 'outlined') {
    InputComponent = OutlinedInput;
  }
  if (variant === 'filled') {
    InputComponent = FilledInput;
  }
  return (
    <FormControl
      className={`resource-select ${className}`}
      disabled={disabled}
      error={error}
      id={id}
      variant={variant}
    >
      <InputLabel
        htmlFor={`resource-select-${name}`}
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
          : ArrowDropDownIcon
        }
        input={<InputComponent id={`resource-select-${name}`} name={name} />}
        inputProps={innerProps}
        onChange={onChange}
        style={{
          fontSize: dense ? '0.8125rem' : '',
        }}
        value={value}
      >
        {resourcesDisplay}
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
 * @property {Array.<any>} resources - List of resources to be selected from.
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

ResourceSelectComponent.propTypes = {
  value: PropTypes.oneOfType([GeneralRecordPropType, PropTypes.string]).isRequired,
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
  required: PropTypes.bool,
  resources: PropTypes.arrayOf(SelectOptionPropType),
  variant: PropTypes.string,
};

ResourceSelectComponent.defaultProps = {
  children: DefaultOptionComponent,
  resources: [],
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
};

export default ResourceSelectComponent;
