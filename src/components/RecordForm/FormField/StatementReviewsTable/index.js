import React from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@material-ui/core';


import '../index.scss';

import StatementReviewRow from './StatementReview';

/**
 * Table to display related linked records as detailChips in embedded link set.
 *
 * @property {Arrayof(objects)} props.values linked records to be displayed in table
 * @property {object} props.values record content to be displayed
 * @property {string} props.variant mode that dialog is in. One of ['view','edit'].
 * @property {function} props.onChange parent change handler function
 * @property {string} props.name the name of this field (for propogating change events)
 */
const StatementReviewsTable = (props) => {
  const {
    values,
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
      <Typography variant="subtitle1" align="center" color="secondary">
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
              value={value}
              index={index}
              onDelete={handleDeleteReview}
              variant={variant}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

StatementReviewsTable.propTypes = {
  values: PropTypes.arrayOf(PropTypes.object),
  variant: PropTypes.string,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

StatementReviewsTable.defaultProps = {
  values: [],
  variant: 'view',
};

export default StatementReviewsTable;
