import React, { useContext, useState, useEffect } from 'react';
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
import EmbeddedIcon from '@material-ui/icons/SelectAll';
import { SnackbarContext } from '@bcgsc/react-snackbar-provider';

import DetailChip from '../../DetailChip';
import { KBContext } from '../../KBContext';
import { getUsername } from '../../../services/auth';
import ReviewDialog from '../ReviewDialog';


/**
 * Table to display related linked records as detailChips in embedded link set.
 *
 * @property {Arrayof(objects)} props.values linked records to be displayed in table
 * @property {string} props.label title of detail chip
 * @property {function} props.onReviewSelection function passed to DetailChip to handle
 * @property {object} props.reviewProps props to be passed to reviewDialog and detail chip
 * review selection for related reviewDialog component
 */
const EmbeddedListTable = (props) => {
  const {
    values, label, reviewProps: { updateContent, content },
  } = props;

  const [isOpenMap, setIsOpenMap] = useState({});
  const context = useContext(KBContext);
  const snackbar = useContext(SnackbarContext);

  useEffect(() => {
    const isOpenMapping = {};
    values.forEach((val, index) => {
      isOpenMapping[index] = false;
    });
  });

  const EmbeddedRecordRow = (value, index) => {
    const {
      status, createdBy: { name }, createdBy,
    } = value;

    const handleDialogToggle = (idx, bool) => {
      const newMapping = { ...isOpenMap };
      newMapping[idx] = bool;
      setIsOpenMap(newMapping);
    };

    const details = {};
    const previewStr = name
      ? `${name} (${createdBy['@rid']})`
      : `${getUsername(context)} (#${createdBy})`;

    const loadedReviewDialog = (
      <ReviewDialog
        isOpen={isOpenMap[index]}
        onClose={() => handleDialogToggle(index, false)}
        content={content}
        updateContent={updateContent}
        snackbar={snackbar}
        formVariant="view"
        reviewIndex={index}
      />
    );

    Object.keys(value).forEach((prop) => {
      if (prop !== '@rid') {
        details[prop] = value[prop];
      }
    });

    return (
      <React.Fragment key={index}>
        <TableRow>
          <TableCell padding="dense">
            {status}
          </TableCell>
          <TableCell>
            <DetailChip
              ChipProps={{
                avatar: (<Avatar><EmbeddedIcon /></Avatar>),
                variant: 'outlined',
                color: 'secondary',
              }
              }
              embeddedLinkSet={{
                content: value,
                dialog: loadedReviewDialog,
                handleDialogOpen: () => { handleDialogToggle(index, true); },
              }}
              label={previewStr}
              title={label}
              details={details}
              valueToString={
                (record) => {
                  if (record && record.name) {
                    return record.name;
                  }
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
          {values.map(EmbeddedRecordRow)}
        </TableBody>
      </Table>
    </div>
  );
};

EmbeddedListTable.propTypes = {
  values: PropTypes.arrayOf(PropTypes.object),
  label: PropTypes.string,
  reviewProps: PropTypes.object.isRequired,
};

EmbeddedListTable.defaultProps = {
  values: [],
  label: '',
};

export default EmbeddedListTable;
