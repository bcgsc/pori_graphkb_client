import './index.scss';

import { Button } from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

const LetterIcon = ({
  value, variant, color, onClick,
}) => (
  <Button
    className={`letter-icon letter-icon--${variant} letter-icon--${color}`}
    disabled={!onClick}
    onClick={onClick}
  >{value}
  </Button>
);

LetterIcon.propTypes = {
  value: PropTypes.string.isRequired,
  color: PropTypes.oneOf(['primary', 'secondary']),
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['outlined', 'contained']),
};

LetterIcon.defaultProps = {
  variant: 'contained',
  color: 'secondary',
  onClick: null,
};

export default LetterIcon;
