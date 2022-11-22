import { ListItem } from '@material-ui/core';
import React, { ReactNode } from 'react';

interface FieldWrapperProps {
  children: ReactNode;
  /** optional/additional css class names */
  className?: string;
  /** the input field type */
  type?: string;
}

/**
 * Wraps a input field inside a list item with standard styling
 */
const FieldWrapper = ({ children, className, type }: FieldWrapperProps) => (
  <ListItem className={`form-field ${type && `form-field--${type}`} ${className}`} component="li">
    {children}
  </ListItem>
);

FieldWrapper.defaultProps = {
  className: '',
  type: '',
};

export default FieldWrapper;
