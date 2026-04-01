import './index.scss';

import { Button } from '@mui/material';
import React from 'react';

interface LetterIconProps {
  value: string;
  color?: 'primary' | 'secondary';
  onClick?: React.ComponentProps<typeof Button>['onClick'];
  variant?: 'outlined' | 'contained';
}

const LetterIcon = ({
  value, variant = 'contained', color = 'secondary', onClick,
}: LetterIconProps) => (
  <Button
    className={`letter-icon letter-icon--${variant} letter-icon--${color}`}
    disabled={!onClick}
    onClick={onClick}
  >
    {value}
  </Button>
);

export default LetterIcon;
