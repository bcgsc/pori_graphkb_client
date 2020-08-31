import './index.scss';

import {
  Chip, IconButton,
  Paper,
  Typography,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';

import LetterIcon from '@/components/LetterIcon';
import schema from '@/services/schema';

import { DATE_FIELDS } from '../constants';

/**
 * Displays Filter Groups and filter chips.
 *
 * @property {object} filterGroup single filter group with the following format
 * @property {integer} filterGroup.key index or key of filterGroup
 * @property {string} filterGroup.name name of current filterGroup
 * @property {ArrayOf<Filters>} filterGroup.filters array of filters with format {attr, value, operator}
 * @property {function} handleDelete parent handler function to delete filterGroup
 */
function FilterGroup({
  name, filters = [], onDelete, onSelect, isSelected, onDeleteFilter,
}) {
  const handleDeleteFilter = useCallback((filterIndex) => {
    onDeleteFilter(filterIndex, name);
  }, [name, onDeleteFilter]);
  return (
    <Paper className="filter-group">
      <div className="filter-group__label">
        <Typography className="filter-group__conjunction">OR</Typography>
        <LetterIcon
          onClick={onSelect}
          value={name}
          variant={isSelected
            ? 'contained'
            : 'outlined'}
        />
      </div>
      <div className="filter-group__content">
        {filters.map((filter, index) => {
          let filterValue = filter.value;

          if (typeof filterValue === 'object' && !Array.isArray(filterValue)) {
            filterValue = schema.getLabel(filter.value);
          } else if (Array.isArray(filterValue)) {
            const filterValueArr = [...filterValue];
            filterValue = (filterValueArr.map(val => schema.getLabel(val))).join(' ');
          } else if (filterValue && DATE_FIELDS.includes(filter.attr)) {
            filterValue = format(new Date(filterValue), 'yyyy-MM-dd\'T\'HH:mm');
          } else if (typeof filterValue === 'string') {
            filterValue = `'${filterValue}'`;
          }
          return (
            <div
              key={`${filter.attr}.${filter.value}`}
              className="filter-chip"
              data-testid={`filter-chip${index}`}
            >
              <Chip
                default="outlined"
                label={`${filter.attr} ${filter.operator} ${filterValue}`}
                onDelete={
                    onDeleteFilter
                      ? () => handleDeleteFilter(index)
                      : null
                  }
              />
            </div>
          );
        })}
      </div>
      {onDelete && (
        <IconButton
          classes={{ label: 'cancel-btn-label' }}
          className="filter-group__cancel-btn"
          data-testid="cancel-btn"
          onClick={() => { onDelete(name); }}
        >
          <CancelIcon />
        </IconButton>
      )}
    </Paper>
  );
}

FilterGroup.propTypes = {
  filters: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
  isSelected: PropTypes.bool,
  onDelete: PropTypes.func,
  onDeleteFilter: PropTypes.func,
  onSelect: PropTypes.func,
};

FilterGroup.defaultProps = {
  isSelected: false,
  onDelete: null,
  onDeleteFilter: null,
  onSelect: () => {},
};

export default FilterGroup;
