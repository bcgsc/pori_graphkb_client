import React from 'react';
import { Typography, IconButton, Chip } from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import PropTypes from 'prop-types';
import './index.scss';

/**
 * Displays filter chips and filter group box
 */
function FilterGroup(props) {
  const { filterGroup, handleDelete } = props;

  return (
    <div className={`filter-groups__box${filterGroup.filters.length ? '' : '--empty'}`}>
      <div className={`filter-groups__group-label${filterGroup.filters.length ? '' : '--empty'}`}>
        <Typography variant="h6">
          {filterGroup.name}
        </Typography>
      </div>
      <div className="filter-groups__cancel-btn">
        <IconButton
          onClick={() => { handleDelete(filterGroup.name); }}
        >
          <CancelIcon />
        </IconButton>
      </div>
      <>
        {filterGroup.filters.map(filter => (
          <div className="filter-chip">
            <Chip
              default="outlined"
              key={`${filter.name}.${filter.value}`}
              label={`${filter.name} ${filter.operator} '${typeof filter.value === 'object' ? filter.value.name : filter.value}'`}
            />
          </div>
        ))}
      </>
    </div>
  );
}

FilterGroup.propTypes = {
  filterGroup: PropTypes.object.isRequired,
  handleDelete: PropTypes.func,
};

FilterGroup.defaultProps = {
  handleDelete: () => {},
};

export default FilterGroup;
