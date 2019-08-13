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

const StatementTable = (props) => {
  const { content, schema } = props;

  const renderStatementRow = statement => (
    <React.Fragment>
      <TableRow>
        <TableCell padding="dense">
          Statment
        </TableCell>
        <TableCell>
          <DetailChip
            label={schema.getLabel(statement)}
            details={statement}
            valueToString={
                (record) => {
                  if (record && record['@rid']) {
                    return record['@rid'];
                  }
                  return `${record}`;
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
      <Typography variant="subtitle1" color="secondary">
         Related Statement Record
      </Typography>
      <Table className="statement-table__table">
        <TableHead
          className="statement-table__table-header"
        >
          <TableRow>
            <TableCell padding="dense">
              Relationship Class
            </TableCell>
            <TableCell padding="dense">
              Related Record
            </TableCell>
          </TableRow>
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
