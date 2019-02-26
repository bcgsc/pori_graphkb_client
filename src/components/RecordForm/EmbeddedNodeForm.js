import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';

import BaseRecordForm from './BaseRecordForm';


/**
 * @property {object} props the input properties
 * @property {string} props.name the name of this form element used in propgating content to the parent form
 * @property {function} props.onValueChange the parent handler function
 */
const EmbeddedNodeForm = (props) => {
  const {
    label, className, onValueChange, ...rest
  } = props;
  return (
    <div className={`embedded-node-form ${className}`}>
      <fieldset>
        <legend>
          <Typography variant="h6">
            {label}
          </Typography>
        </legend>
        <BaseRecordForm onValueChange={onValueChange} isEmbedded {...rest} />
      </fieldset>
    </div>
  );
};


EmbeddedNodeForm.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string.isRequired,
  onValueChange: PropTypes.func.isRequired,
};

EmbeddedNodeForm.defaultProps = {
  className: '',
};

export default EmbeddedNodeForm;
