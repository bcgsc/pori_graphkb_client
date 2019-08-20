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

import DetailChip from '../DetailChip';
/**
 * Table in review dialog to relate review to Statement record. Display purposes.
 *
 * @property {object} props.content Statement Record to be displayed in detail DetailChip
 * @property {Schema} props.schema schema object for detail chip props and data handling
 */
const StatementTable = (props) => {
  const { content, schema } = props;

  const renderStatementRow = statement => (
    <React.Fragment>
      <TableRow>
        <TableCell padding="dense">
          <Typography variant="subtitle1" color="secondary">
                  Statement under review
          </Typography>
        </TableCell>
        <TableCell>
          <DetailChip
            label={schema.getLabel(statement)}
            details={statement}
            valueToString={
                (record) => {
                  if (Array.isArray(record)) {
                    if (record[0]['@class'] === 'StatementReview') {
                      return record.length;
                    }
                    const strVals = record.map(val => (schema.getLabel(val)));
                    const label = strVals.join(', ');
                    return label;
                  }
                  const label = schema.getLabel(record);
                  return label;
                }
              }
            getLink={schema.getLink}
          />
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
  return (
    <div className="statement-table">
      <Table className="statement-table__table">
        <TableHead>
          <TableCell />
          <TableCell />
        </TableHead>
        <TableBody>
          { renderStatementRow(content) }
        </TableBody>
      </Table>
    </div>
  );
};

StatementTable.propTypes = {
  content: PropTypes.object.isRequired,
  schema: PropTypes.object.isRequired,
};


export default StatementTable;
