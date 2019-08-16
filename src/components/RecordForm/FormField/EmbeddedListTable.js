import React from 'react';
import PropTypes from 'prop-types';


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Avatar,
} from '@material-ui/core';
import AssignmentOutlinedIcon from '@material-ui/icons/AssignmentOutlined';

import DetailChip from '../../DetailChip';


/**
 * Table to display related linked records as detailChips in embedded link set.
 *
 * @property {Arrayof(objects)} props.values linked records to be displayed in table
 * @property {string} props.label title of detail chip
 * @property {function} props.handleReviewSelection function passed to DetailChip to handle
 * review selection for related reviewDialog component
 */
const EmbeddedListTable = (props) => {
  const {
    values, label, handleReviewSelection,
  } = props;


  const EmbeddedRecordRow = (value, index) => {
    const {
      status, createdBy: { name }, createdBy,
    } = value;
    const previewStr = `${name} (${createdBy['@rid']})`;
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
              ChipProps={{
                avatar: (<Avatar><AssignmentOutlinedIcon /></Avatar>),
                variant: 'outlined',
                color: 'secondary',
              }
              }
              isEmbeddedLinkSet={{
                handleReviewSelection,
                reviewIndex: index,
                content: value,
              }}
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
              Reviewer
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

EmbeddedListTable.propTypes = {
  values: PropTypes.arrayOf(PropTypes.object),
  label: PropTypes.string,
  handleReviewSelection: PropTypes.func.isRequired,
};

EmbeddedListTable.defaultProps = {
  values: [],
  label: '',
};

export default EmbeddedListTable;
