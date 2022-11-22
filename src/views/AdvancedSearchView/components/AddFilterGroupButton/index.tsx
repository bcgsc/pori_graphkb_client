import './index.scss';

import { Button } from '@material-ui/core';
import React from 'react';

interface AddFilterGroupButtonProps {
  onClick: React.ComponentProps<typeof Button>['onClick'];
}

const AddFilterGroupButton = ({ onClick }: AddFilterGroupButtonProps) => (
  <Button className="add-filter-group" onClick={onClick}>Add New Filter Group</Button>
);

export default AddFilterGroupButton;
