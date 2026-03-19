import './index.scss';

import TreeIcon from '@mui/icons-material/AccountTree';
import CancelIcon from '@mui/icons-material/Cancel';
import ShareIcon from '@mui/icons-material/Share';
import {
  Chip, ChipProps, IconButton,
  Paper,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import React, { useCallback } from 'react';

import LetterIcon from '@/components/LetterIcon';
import schema from '@/services/schema';

import { DATE_FIELDS } from '../constants';
import { VerboseFilterType } from '../useFilterGroups';

interface FilterGroupProps {
  filters: VerboseFilterType[];
  name: string;
  isSelected?: boolean;
  onDelete?: (name: string) => void;
  onDeleteFilter?: (index: number, name: string) => void;
  onSelect?: React.ComponentProps<typeof LetterIcon>['onClick'];
}

/**
 * Displays Filter Groups and filter chips.
 */
function FilterGroup({
  name, filters = [], onDelete, onSelect, isSelected = false, onDeleteFilter,
}: FilterGroupProps) {
  const handleDeleteFilter = useCallback((filterIndex) => {
    onDeleteFilter?.(filterIndex, name);
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
            filterValue = format(new Date(filterValue as any), 'yyyy-MM-dd\'T\'HH:mm');
          } else if (typeof filterValue === 'string') {
            filterValue = `'${filterValue}'`;
          }
          let icon: ChipProps['icon'];

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
                icon={icon}
                label={`${filter.attr} ${filter.operator} ${filterValue}`}
                onDelete={
                    onDeleteFilter
                      ? () => handleDeleteFilter(index)
                      : undefined
                  }
              />
            </div>
          );
        })}
      </div>
      {onDelete && (
        <IconButton
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

export default FilterGroup;
