import './index.scss';

import { Button } from '@material-ui/core';
import React from 'react';

interface LetterIconProps {
  value: string;
  color?: 'primary' | 'secondary';
  onClick?: React.ComponentProps<typeof Button>['onClick'];
  variant?: 'outlined' | 'contained';
}

const LetterIcon = ({
  value, variant, color, onClick,
}: LetterIconProps) => (
  <Button
    className={`letter-icon letter-icon--${variant} letter-icon--${color}`}
    disabled={!onClick}
    onClick={onClick}
  >
    {value}
  </Button>
);

LetterIcon.defaultProps = {
  variant: 'contained',
  color: 'secondary',
  onClick: null,
};

export default LetterIcon;
