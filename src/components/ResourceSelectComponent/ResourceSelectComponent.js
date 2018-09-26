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
} from '@material-ui/core';

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
  } = props;

  const resourcesDisplay = resources.map(resource => children(resource));

  return (
    <FormControl className="resource-select" id={id}>
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
        inputProps={{
          name,
          id: `resource-select-${name}`,
        }}
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
};

ResourceSelectComponent.defaultProps = {
  children: resource => (
    <MenuItem key={resource.name} value={resource['@rid']}>
      {resource.name}
    </MenuItem>
  ),
  resources: [],
  onChange: null,
  name: '',
  label: '',
  required: false,
  error: false,
  id: '',
  dense: false,
};

export default ResourceSelectComponent;
