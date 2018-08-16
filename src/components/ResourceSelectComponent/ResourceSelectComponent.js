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
 * @param {Array} props.resources - Resource options.
 * @param {Object} props.value - Value to bind component to.
 * @param {function} props.onChange - Parent method triggered on change event.
 * @param {string} props.name - Name for event parsing.
 * @param {string} props.label - Label for input component.
 * @param {function} props.children - Optional rendering function for options.
 * @param {bool} props.required - Required flag for input component.
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
    <FormControl
      className="resource-select"
      style={{
        width: '100%',
        minWidth: `${label.length * 16}px`,
        maxWidth: '100%',
      }}
      id={id}
    >
      <InputLabel
        htmlFor="resource-select"
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
          id: 'resource-select',
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
