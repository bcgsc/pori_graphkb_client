
import React from 'react';
import PropTypes from 'prop-types';

import ClickToolTip from '../../ClickToolTip';

/**
 * Clickable Question mark Icon that displays some description
 * which helps explain to the user what the
 * form field they are looking at should be filled
 * with
 *
 * @param {object} props
 * @param {string} props.example an example value
 * @param {string} props.description the description of the form field
 */
const FieldHelp = ({ example, description }) => {
  let text;
  if (description) {
    text = description;
    if (example) {
      text = `${text} (Example: ${example})`;
    }
  }
  return (
    <ClickToolTip
      title={text}
    />
  );
};

FieldHelp.propTypes = {
  description: PropTypes.string,
  example: PropTypes.string,
};

FieldHelp.defaultProps = {
  description: '',
  example: '',
};


export default FieldHelp;
