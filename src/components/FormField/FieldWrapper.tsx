import { ListItem } from '@material-ui/core';
import React from 'react';

interface FieldWrapperProps {
  children: React.ReactElement;
  /** optional/additional css class names */
  className?: string;
  /** the input field type */
  type?: string;
}

/**
 * Wraps a input field inside a list item with standard styling
 */
function FieldWrapper(props: FieldWrapperProps) {
  const {
    children,
    className,
    type,
  } = props;
  return (
    <ListItem className={`form-field ${type && `form-field--${type}`} ${className}`} component="li">
      {children}
    </ListItem>
  );
}

FieldWrapper.defaultProps = {
  className: '',
  type: '',
};

export default FieldWrapper;
