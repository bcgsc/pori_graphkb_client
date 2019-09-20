import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@material-ui/core';


import { KBContext } from '../../../KBContext';
import '../index.scss';

import EmbeddedRecordRow from './StatementReview';

/**
 * Table to display related linked records as detailChips in embedded link set.
 *
 * @property {Arrayof(objects)} props.values linked records to be displayed in table
 * @property {string} props.label title of detail chip
 * @property {function} props.onReviewSelection function passed to DetailChip to handle
 * @property {object} props.reviewProps props to be passed to reviewDialog and detail chip
 * @property {function} props.updateContent parent handler function to update record
 * @property {object} props.content record content to be displayed
 * @property {string} props.variant mode that dialog is in. One of ['view','edit'].
 *
 */
const EmbeddedListTable = (props) => {
  const {
    values,
    label,
    reviewProps: { updateContent, content },
    variant,
  } = props;

  const context = useContext(KBContext);
  const embeddedRecordProps = {
    variant,
    content,
    updateContent,
    label,
    context,
  };

  return (
    <div className="embedded-list-table">
      <Typography variant="subtitle1" align="center" color="secondary">
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
          {values.map((value, index) => EmbeddedRecordRow({ value, index, ...embeddedRecordProps }))}
        </TableBody>
      </Table>
    </div>
  );
};

EmbeddedListTable.propTypes = {
  values: PropTypes.arrayOf(PropTypes.object),
  label: PropTypes.string,
  reviewProps: PropTypes.object.isRequired,
  updateContent: PropTypes.func.isRequired,
  variant: PropTypes.string,
};

EmbeddedListTable.defaultProps = {
  values: [],
  label: '',
  variant: 'view',
};

export default EmbeddedListTable;
