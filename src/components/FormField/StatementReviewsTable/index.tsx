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

import StatementReviewRow from './StatementReview';

interface StatementReviewsTableProps {
  /** the name of this field (for propogating change events) */
  name: string;
  /** parent change handler function */
  onChange:(e: { target: { name: string, value: object[] } }) => void;
  /** linked records to be displayed in table */
  values?: object[];
  /**
   * mode that dialog is in
   * @default 'view'
   */
  variant?: 'view' | 'edit';
}

/**
 * Table to display related linked records as detailChips in embedded link set.
 */
function StatementReviewsTable(props: StatementReviewsTableProps) {
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
}

StatementReviewsTable.defaultProps = {
  values: [],
  variant: 'view',
};

export default StatementReviewsTable;
