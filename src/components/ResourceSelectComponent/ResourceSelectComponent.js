/**
 * @module /components/ResourceSelectComponent
 */

import React from 'react';
import PropTypes from 'prop-types';
import './ResourceSelectComponent.css';
import {
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  FilledInput,
  OutlinedInput,
  Input,
} from '@material-ui/core';
import util from '../../services/util';

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
    error,
    dense,
    variant,
  } = props;

  const resourcesDisplay = resources.map(resource => children(resource));
  let InputComponent = Input;
  if (variant === 'outlined') {
    InputComponent = OutlinedInput;
  }
  if (variant === 'filled') {
    InputComponent = FilledInput;
  }
  return (
    <FormControl
      className="resource-select"
      id={id}
      variant={variant}
    >
      <InputLabel
        htmlFor={`resource-select-${name}`}
        required={required}
        error={error}
        style={{
          fontSize: dense ? '0.8125rem' : '',
        }}
      >
        {label}
      </InputLabel>
      <Select
        value={value}
        onChange={onChange}
        error={error}
        input={<InputComponent name={name} id={`resource-select-${name}`} />}
        style={{
          fontSize: dense ? '0.8125rem' : '',
        }}
      >
        {resourcesDisplay}
      </Select>
    </FormControl>
  );
}

/**
 * @namespace
 * @property {Array} resources - List of resources to be selected from.
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
 */
ResourceSelectComponent.propTypes = {
  resources: PropTypes.array,
  value: PropTypes.any.isRequired,
  onChange: PropTypes.func,
  name: PropTypes.string,
  label: PropTypes.string,
  children: PropTypes.func,
  required: PropTypes.bool,
  error: PropTypes.bool,
  id: PropTypes.string,
  dense: PropTypes.bool,
  variant: PropTypes.string,
};

ResourceSelectComponent.defaultProps = {
  children: resource => (
    <MenuItem key={resource} value={resource}>
      {util.antiCamelCase(resource)}
    </MenuItem>
  ),
  resources: [],
  onChange: null,
  name: '',
  label: '',
  required: false,
  error: false,
  id: undefined,
  dense: false,
  variant: 'standard',
};

export default ResourceSelectComponent;
