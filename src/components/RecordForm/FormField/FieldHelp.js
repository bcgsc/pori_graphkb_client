
import React from 'react';
import PropTypes from 'prop-types';

import ClickToolTip from '../../ClickToolTip';

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
