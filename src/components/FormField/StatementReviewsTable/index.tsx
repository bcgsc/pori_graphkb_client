import '../index.scss';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';

import { FormContextState } from '@/components/FormContext';
import { GeneralRecordType } from '@/components/types';

import StatementReviewRow from './StatementReview';

interface StatementReviewsTableProps {
  /** the name of this field (for propagating change events) */
  name: string;
  /** parent change handler function */
  onChange: FormContextState['updateFieldEvent'];
  /** linked records to be displayed in table */
  value?: (Omit<GeneralRecordType, 'createdBy'> & { createdBy: string | GeneralRecordType })[];
  disabled?: boolean;
}

/**
 * Table to display related linked records as detailChips in embedded link set.
 */
const StatementReviewsTable = (props: StatementReviewsTableProps) => {
  const {
    value: values = [],
    disabled,
    onChange,
    name,
  } = props;

  const handleDeleteReview = ({ index }) => {
    const newValue = [...values.slice(0, index), ...values.slice(index + 1)];
    onChange({ target: { name, value: newValue } });
  };

  return (
    <div className="embedded-list-table">
      <Typography align="center" color="secondary" variant="subtitle1">
        Reviews
      </Typography>
      <Table className="embedded-list-table__table">
        <TableHead className="embedded-list-table__table-header">
          <TableRow>
            <TableCell size="small">
              Review Status
            </TableCell>
            <TableCell size="small">
              Reviewer
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {values.map((value, index) => (
            <StatementReviewRow
              disabled={disabled}
              index={index}
              onDelete={handleDeleteReview}
              value={value}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default StatementReviewsTable;
