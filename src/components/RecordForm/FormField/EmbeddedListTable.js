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
import DetailChip from '../../DetailChip';

const MAX_PREVIEW_LEN = 30;


const EmbeddedListTable = (props) => {
  const {
    values, label, name, error, content, handleReviewSelection,
  } = props;
  console.log('TCL: EmbeddedListTable -> values, label, name, error', values, label, name, error);


  const EmbeddedRecordRow = (value) => {
    console.log('TCL: EmbeddedRecordRow -> value', value);
    const { status, comment } = value;
    const previewStr = comment.slice(0, MAX_PREVIEW_LEN);
    const details = {};
    Object.keys(value).forEach((prop) => {
      details[prop] = value[prop];
    });

    return (
      <React.Fragment>
        <TableRow>
          <TableCell padding="dense">
            {status}
          </TableCell>
          <TableCell>
            <DetailChip
              isEmbedded
              handleReviewSelection={handleReviewSelection}
              label={previewStr}
              title={label}
              details={details}
              valueToString={
                (record) => {
                  if (record && record['@rid']) {
                    return record['@rid'];
                  }
                  return `${record}`;
                }
              }
              content={value}
            />
          </TableCell>
        </TableRow>
      </React.Fragment>
    );
  };

  return (
    <div className="embedded-list-table">
      <Typography variant="h6" component="h2">
              Reviews
      </Typography>
      <Table className="embedded-list-table__table">
        <TableHead className="embedded-list-table__table-header">
          <TableRow>
            <TableCell padding="dense">
              Review Status
            </TableCell>
            <TableCell padding="dense">
              Review Record
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {values.map(EmbeddedRecordRow)}
        </TableBody>
      </Table>
    </div>
  );
};

EmbeddedListTable.prototype = {
  values: PropTypes.arrayOf(PropTypes.object),
  label: PropTypes.string,
  content: PropTypes.object.isRequired,
};

EmbeddedListTable.defaultProps = {
  values: [],
  label: '',
};

export default EmbeddedListTable;
