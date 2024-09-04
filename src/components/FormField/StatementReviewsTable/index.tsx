import '../index.scss';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@material-ui/core';
import React from 'react';

import { FORM_VARIANT } from '@/components/util';

import StatementReviewRow from './StatementReview';

interface StatementReviewsTableProps {
  /** the name of this field (for propagating change events) */
  name: string;
  /** parent change handler function */
  onChange: (...args: unknown[]) => void;
  /** linked records to be displayed in table */
  values?: Record<string, unknown>[];
  /** mode that dialog is in. One of ['view','edit']. */
  variant?: FORM_VARIANT.VIEW | FORM_VARIANT.EDIT;
}

/**
 * Table to display related linked records as detailChips in embedded link set.
 */
const StatementReviewsTable = (props: StatementReviewsTableProps) => {
  const {
    values = [],
    variant,
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
              index={index}
              onDelete={handleDeleteReview}
              value={value}
              variant={variant}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

StatementReviewsTable.defaultProps = {
  values: [],
  variant: FORM_VARIANT.VIEW,
};

export default StatementReviewsTable;
