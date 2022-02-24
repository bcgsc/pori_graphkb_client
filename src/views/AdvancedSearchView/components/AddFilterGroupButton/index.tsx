import './index.scss';

import { Button, ButtonProps } from '@material-ui/core';
import React from 'react';

interface AddFilterGroupButtonProps {
  onClick: NonNullable<ButtonProps['onClick']>;
}

function AddFilterGroupButton({ onClick }: AddFilterGroupButtonProps) {
  return <Button className="add-filter-group" onClick={onClick}>Add New Filter Group</Button>;
}

export default AddFilterGroupButton;
