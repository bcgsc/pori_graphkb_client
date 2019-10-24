import React, { useContext } from 'react';
import { Typography, IconButton, Chip } from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import PropTypes from 'prop-types';

import './index.scss';
import { KBContext } from '../../../components/KBContext';

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
  const { schema } = useContext(KBContext);

  return (
    <div className={`filter-groups__box${filterGroup.filters.length ? '' : '--empty'}`}>
      <div className={`filter-groups__group-label${filterGroup.filters.length ? '' : '--empty'}`}>
        <Typography variant="h6">
          {filterGroup.name}
        </Typography>
      </div>
      <div className="filter-groups__cancel-btn">
        <IconButton
          data-testid="cancel-btn"
          classes={{ label: 'cancel-btn-label' }}
          onClick={() => { handleDelete(filterGroup.name); }}
        >
          <CancelIcon />
        </IconButton>
      </div>
      <>
        {filterGroup.filters.map((filter, index) => {
          let filterValue = filter.value;

          if (typeof filterValue === 'object' && !Array.isArray(filterValue)) {
            filterValue = schema.getPreview(filter.value);
          } else if (Array.isArray(filterValue)) {
            const filterValueArr = [...filterValue];
            filterValue = '';
            filterValueArr.forEach((val) => {
              filterValue += ` ${schema.getPreview(val)}`;
            });
          }

          return (
            <div className="filter-chip" data-testid={`filter-chip${index}`}>
              <Chip
                default="outlined"
                key={`${filter.attr}.${filter.value}`}
                label={`${filter.attr} ${filter.operator} '${filterValue} '`}
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
