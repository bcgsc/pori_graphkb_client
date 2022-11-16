import './index.scss';

import {
  Chip, IconButton,
  Paper,
  Typography,
} from '@material-ui/core';
import TreeIcon from '@material-ui/icons/AccountTree';
import CancelIcon from '@material-ui/icons/Cancel';
import ShareIcon from '@material-ui/icons/Share';
import { format } from 'date-fns';
import React, { ReactElement, useCallback } from 'react';

import LetterIcon from '@/components/LetterIcon';
import schema from '@/services/schema';

import { DATE_FIELDS } from '../constants';

interface FilterGroupProps {
  filters: { value: unknown; attr: string; operator: string; subqueryType?: string }[];
  name: string;
  isSelected?: boolean;
  onDelete?: ((name: string) => void) | null;
  onDeleteFilter?: (index: number, name: string) => void;
  onSelect?: React.ComponentProps<typeof LetterIcon>['onClick'];
}

/**
 * Displays Filter Groups and filter chips.
 */
function FilterGroup({
  name, filters = [], onDelete, onSelect, isSelected, onDeleteFilter,
}: FilterGroupProps) {
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
            filterValue = (filterValueArr.map((val) => schema.getLabel(val))).join(' ');
          } else if (filterValue && DATE_FIELDS.includes(filter.attr)) {
            filterValue = format(new Date(filterValue), 'yyyy-MM-dd\'T\'HH:mm');
          } else if (typeof filterValue === 'string') {
            filterValue = `'${filterValue}'`;
          }
          let icon: ReactElement = null;

          if (filter.subqueryType === 'keyword') {
            icon = (<ShareIcon />);
          } else if (filter.subqueryType === 'tree') {
            icon = (<TreeIcon />);
          }
          return (
            <div
              key={`${filter.attr}.${filter.value}`}
              className="filter-chip"
              data-testid={`filter-chip${index}`}
            >
              <Chip
                default="outlined"
                icon={icon}
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

FilterGroup.defaultProps = {
  isSelected: false,
  onDelete: null,
  onDeleteFilter: null,
  onSelect: () => {},
};

export default FilterGroup;
