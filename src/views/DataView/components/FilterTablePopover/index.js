import React from 'react';
import PropTypes from 'prop-types';
import {
  Avatar, Card, Chip, CardContent, Popover, Typography,
} from '@material-ui/core';

import './index.scss';

/**
 * Card Popup that displays the filter groups applied to search
 *
 * @property {func} handleToggle parent handler to open/close popover
 * @property {bool} isOpen whether or not popover should be open
 * @property {DOM element} anchorEl which DOM element popover should anchor to
 * @property {arrayOf<Objects>} filterGroups collection of filtergroups applied to search
 */
function FilterTablePopover(props) {
  const {
    handleToggle, isOpen, anchorEl, filterGroups,
  } = props;

  const renderRow = filters => (
    <div className="filter-row">
      <div className="filter-row__icon">
        <Avatar
          aria-label="Filter Group Icon"
          className="filter-row__avatar"
        >
            FG
        </Avatar>
      </div>
      <div className="filter-row__chips">
        <>
          {filters.map(filter => (
            <div className="display-chip">
              <Chip
                key={filter}
                label={filter}
              />
            </div>
          ))}
        </>
      </div>
    </div>
  );

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
        <Card>
          <CardContent className="filter-table">
            <div className="filter-table__title">
              <Typography variant="h5"> Advanced Search Filter Groups</Typography>
            </div>
            <div className="filter-table__content">
              {filterGroups.map(renderRow)}
            </div>
          </CardContent>
        </Card>
      </Popover>
    </div>
  );
}

FilterTablePopover.propTypes = {
  anchorEl: PropTypes.object.isRequired,
  filterGroups: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  handleToggle: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};

export default FilterTablePopover;
