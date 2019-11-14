import React from 'react';
import PropTypes from 'prop-types';
import {
  Popover,
} from '@material-ui/core';

function FilterTablePopover(props) {
  const {
    handleToggle, isOpen, anchorEl, filterGroups,
  } = props;
  console.log('TCL: FilterTablePopover -> filterGroups', filterGroups);

  return (
    <div>
      <Popover
        id="filter-table-popover"
        open={isOpen}
        onClose={handleToggle}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <h1>HELLO WORLD</h1>
        <h2>I AM GROOT</h2>
      </Popover>
    </div>
  );
}

FilterTablePopover.propTypes = {
  handleToggle: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  anchorEl: PropTypes.object.isRequired,
};

export default FilterTablePopover;
