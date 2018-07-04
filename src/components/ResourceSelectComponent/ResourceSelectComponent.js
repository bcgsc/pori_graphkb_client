import React from 'react';
import PropTypes from 'prop-types';
import './ResourceSelectComponent.css';
import {
  InputLabel,
  MenuItem,
  FormControl,
  Select,
} from '@material-ui/core';

function ResourceSelectComponent(props) {
  const {
    resources,
    value,
    onChange,
    name,
    label,
    children,
  } = props;

  const resourcesDisplay = resources.map(resource => children(resource));
  return (
    <FormControl className="type-select" style={{ width: '100%' }}>
      <InputLabel htmlFor="resource-select">
        {label}
      </InputLabel>
      <Select
        value={value}
        onChange={onChange}
        inputProps={{
          name,
          id: 'resource-select',
        }}
      >
        <MenuItem value="">
          <em>
            None
          </em>
        </MenuItem>
        {resourcesDisplay}
      </Select>
    </FormControl>
  );
}

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
};

ResourceSelectComponent.propTypes = {
  resources: PropTypes.array,
  value: PropTypes.any.isRequired,
  onChange: PropTypes.func,
  name: PropTypes.string,
  label: PropTypes.string,
  children: PropTypes.func,
};

export default ResourceSelectComponent;
