import { ListItem } from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';


const FieldWrapper = ({ children, className, type }) => (
  <ListItem className={`form-field ${type && `form-field--${type}`} ${className}`} component="li">
    {children}
  </ListItem>
);


FieldWrapper.propTypes = {
  children: PropTypes.element.isRequired,
  className: PropTypes.string,
  type: PropTypes.string,
};

FieldWrapper.defaultProps = {
  className: '',
  type: '',
};


export default FieldWrapper;
