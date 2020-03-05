import './index.scss';

import { Chip, IconButton, Typography } from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import PropTypes from 'prop-types';
import React from 'react';

import schema from '@/services/schema';

/**
 * Displays Filter Groups and filter chips.
 *
 * @property {object} filterGroup single filter group with the following format
 * @property {integer} filterGroup.key index or key of filterGroup
 * @property {string} filterGroup.name name of current filterGroup
 * @property {ArrayOf<Filters>} filterGroup.filters array of filters with format {attr, value, operator}
 * @property {function} handleDelete parent handler function to delete filterGroup
 */
function FilterGroup(props) {
  const { filterGroup, handleDelete } = props;

  return (
    <div className="filter-groups__box">
      <div className="filter-groups__group-label">
        <Typography variant="h6">
          {filterGroup.name}
        </Typography>
      </div>
      <div className="filter-groups__cancel-btn">
        <IconButton
          classes={{ label: 'cancel-btn-label' }}
          data-testid="cancel-btn"
          onClick={() => { handleDelete(filterGroup.name); }}
        >
          <CancelIcon />
        </IconButton>
      </div>
      <>
        {filterGroup.filters.map((filter, index) => {
          let filterValue = filter.value;

          if (typeof filterValue === 'object' && !Array.isArray(filterValue)) {
            filterValue = schema.getLabel(filter.value);
          } else if (Array.isArray(filterValue)) {
            const filterValueArr = [...filterValue];
            filterValue = (filterValueArr.map(val => schema.getLabel(val))).join(' ');
          }

          return (
            <div className="filter-chip" data-testid={`filter-chip${index}`}>
              <Chip
                key={`${filter.attr}.${filter.value}`}
                default="outlined"
                label={`${filter.attr} ${filter.operator} '${filterValue}'`}
              />
            </div>
          );
        })}
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
