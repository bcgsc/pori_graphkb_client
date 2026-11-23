import './index.scss';

import { util } from '@bcgsc-pori/graphkb-schema';
import TreeIcon from '@mui/icons-material/AccountTree';
import CancelIcon from '@mui/icons-material/Cancel';
import ShareIcon from '@mui/icons-material/Share';
import {
  Chip, IconButton,
  Paper,
  Skeleton,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import React, { useMemo } from 'react';
import { useQuery } from 'react-query';

import LetterIcon from '@/components/LetterIcon';
import { Comparison, FixedSubQuery } from '@/components/types';
import { extractRids, tuple } from '@/components/util';
import api from '@/services/api';
import { ErrorMessage } from '@/services/errors';
import schema from '@/services/schema';

import { DATE_FIELDS } from '../constants';

function formatValue(value: unknown, attr: string, labels: Record<string, string>): string {
  if (Array.isArray(value)) {
    return `(${value.map((item) => formatValue(item, attr, labels)).join(', ')})`;
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }
  let label: string | undefined;

  if (value && DATE_FIELDS.includes(attr) && (typeof value === 'string' || typeof value === 'number')) {
    try {
      label = format(new Date(value), 'yyyy-MM-dd\'T\'HH:mm');
    } catch {
      // skip formatting invalid date
    }
  }

  if (!label && typeof value === 'string') {
    label = value;

    if (util.looksLikeRID(value)) {
      label = labels[value] || value;
    }
  }
  if (label) {
    return `'${label}'`;
  }
  return JSON.stringify(value);
}

export function getComparisonLabelAndIcon(filter: Comparison, labelsByRid: Record<string, string>) {
  const { operator = '=', ...rest } = filter;

  if (Object.keys(rest).length !== 1) {
    // does not follow expected pattern, but still show something
    return { label: JSON.stringify(filter) };
  }

  const [attr, value] = Object.entries(rest)[0];

  if (value && typeof value === 'object' && ('similarTo' in value || ('queryType' in value && value.queryType === 'similarTo'))) {
    const { target } = value as FixedSubQuery & { queryType: 'similarTo' };

    if (target && (typeof target === 'object' && ('queryType' in target))) {
      if (target.queryType === 'keyword') {
        return {
          label: `${attr} ${target.operator ?? 'CONTAINSTEXT'} ${formatValue(target.keyword, attr, labelsByRid)}`,
          icon: <ShareIcon />,
        };
      }
      if (target.queryType === 'ancestors' || target.queryType === 'descendants') {
        return {
          label: `${attr} ${operator} ${formatValue(target.target, attr, labelsByRid)}`,
          icon: <TreeIcon />,
        };
      }
    }
  }

  return { label: `${attr} ${operator} ${formatValue(value, attr, labelsByRid)}` };
}

interface FilterGroupProps {
  filters: Comparison[];
  groupIndex: number;
  name: string;
  isSelected?: boolean;
  onDelete?: (groupIndex: number) => void;
  onDeleteFilter?: (groupIndex: number, filterIndex: number) => void;
  onSelect?: React.ComponentProps<typeof LetterIcon>['onClick'];
}

/**
 * Displays Filter Groups and filter chips.
 */
function FilterGroup({
  name, filters = [], onDelete, onSelect, isSelected = false, onDeleteFilter, groupIndex,
}: FilterGroupProps) {
  const rids = useMemo(() => extractRids(filters), [filters]);
  const labels = useQuery({
    queryKey: tuple('/query', { target: rids, returnProperties: ['@rid', '@class', 'name', 'displayName'] }),
    queryFn: async ({ queryKey: [, body] }) => api.query(body),
    enabled: rids.length > 0,
    select: (records) => Object.fromEntries(records.map((record) => [record['@rid'], schema.getLabel(record)])),
  });

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
        {labels.isError && <ErrorMessage error={labels.error}>Failed to load filter labels.</ErrorMessage>}
        {labels.isLoading ? <Skeleton role="progressbar" /> : filters.map((filter, index) => {
          const { label, icon } = getComparisonLabelAndIcon(filter, labels.data || {});
          return (
            <div
              // must use index as the same filter can currently be added twice
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className="filter-chip"
              data-testid={`filter-chip${index}`}
            >
              <Chip
                icon={icon}
                label={label}
                onDelete={
                    onDeleteFilter
                      ? () => onDeleteFilter(groupIndex, index)
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
          onClick={() => { onDelete(groupIndex); }}
        >
          <CancelIcon />
        </IconButton>
      )}
    </Paper>
  );
}

export default FilterGroup;
