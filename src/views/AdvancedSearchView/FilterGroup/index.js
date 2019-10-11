import React, { useContext } from 'react';
import { Typography, IconButton, Chip } from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import PropTypes from 'prop-types';
import './index.scss';
import { KBContext } from '../../../components/KBContext';

/**
 * Displays filter chips and filter group box
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
          onClick={() => { handleDelete(filterGroup.name); }}
        >
          <CancelIcon />
        </IconButton>
      </div>
      <>
        {filterGroup.filters.map((filter) => {
          let filterValue = filter.value;

          if (typeof filterValue === 'object' && !Array.isArray(filterValue)) {
            filterValue = schema.getPreview(filter.value);
          } else if (Array.isArray(filterValue)) {
            filterValue = schema.getPreview(filter.value[0]);
          }

          return (
            <div className="filter-chip">
              <Chip
                default="outlined"
                key={`${filter.attr}.${filter.value}`}
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
