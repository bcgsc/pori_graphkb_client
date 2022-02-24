import './index.scss';

import { Button, ButtonProps } from '@material-ui/core';
import React from 'react';

interface LetterIconProps {
  value: string;
  /**
   * @default 'secondary'
   */
  color?: 'primary' | 'secondary';
  onClick?: ButtonProps['onClick'];
  /**
   * @default 'contained'
   */
  variant?: 'outlined' | 'contained';
}

function LetterIcon(props: LetterIconProps) {
  const {
    value,
    variant,
    color,
    onClick,
  } = props;
  return (
    <Button
      className={`letter-icon letter-icon--${variant} letter-icon--${color}`}
      disabled={!onClick}
      onClick={onClick}
    >{value}
    </Button>
  );
}

LetterIcon.defaultProps = {
  variant: 'contained',
  color: 'secondary',
  onClick: null,
};

export default LetterIcon;
