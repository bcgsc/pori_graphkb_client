
import PropTypes from 'prop-types';
import React from 'react'; // eslint-disable-line no-unused-vars


/**
 * Component to pass the step props to (label and fields) which is not actually displayed
 */
const FormStepWrapper = ({
  children,
}) => children;

FormStepWrapper.propTypes = {
  children: PropTypes.element.isRequired,
  label: PropTypes.string.isRequired,
  fields: PropTypes.arrayOf(PropTypes.string),
};

FormStepWrapper.defaultProps = {
  fields: [],
};

export default FormStepWrapper;
