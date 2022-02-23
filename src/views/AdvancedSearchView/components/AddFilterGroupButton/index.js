import './index.scss';

import { Button } from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

function AddFilterGroupButton({ onClick }) {
  return <Button className="add-filter-group" onClick={onClick}>Add New Filter Group</Button>;
}

AddFilterGroupButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default AddFilterGroupButton;
