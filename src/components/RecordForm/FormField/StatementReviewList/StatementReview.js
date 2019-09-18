import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Avatar,
  CardHeader,
  Card,
  CardContent,
  Divider,
} from '@material-ui/core';
import EmbeddedIcon from '@material-ui/icons/SelectAll';
import DeleteIcon from '@material-ui/icons/Delete';


import DetailChip from '../../../DetailChip';
import { KBContext } from '../../../KBContext';
import { getUsername } from '../../../../services/auth';
import ActionButton from '../../../ActionButton';
import '../index.scss';

/**
 * Displays a linked record row + detail chip in EmbeddedListTable.
 *
 * @property {object} props.value single linked record or review
 * @property {string} props.variant one of ['view', 'edit'] mode
 * @property {object} props.content full record which has link to value
 * @property {function} props.updateContent parent handler function to update record
 */
const EmbeddedRecordRow = (props) => {
  const {
    value,
    index,
    variant,
    content,
    updateContent,
    label,
    context,
  } = props;
  const {
    status, createdBy: { name }, createdBy,
  } = value;

  const cloneReviews = (cont) => {
    const { reviews } = cont;

    if (reviews) {
      const reviewsClone = reviews.map(obj => ({ ...obj }));
      return reviewsClone;
    }
    return [];
  };

  const handleDelete = (cont, idx) => {
    const newContent = Object.assign({}, cont);
    const clonedReviews = cloneReviews(cont);
    newContent.reviews = clonedReviews;
    newContent.reviews.splice(idx, 1);

    try {
      updateContent(newContent);
    } catch (err) {
      console.error(err);
    }
  };

  const details = {};
  const previewStr = name
    ? `${name} (${createdBy['@rid']})`
    : `${getUsername(context)} (#${createdBy})`;

  const ReviewComp = (reviewProps) => {
    const {
      value: { comment },
    } = reviewProps;

    return (
      <div className="review-card">
        <Card>
          <div className="review-card__header">
            <CardHeader
              avatar={(
                <Avatar
                  aria-label="Statement Review"
                  className="review-card__avatar"
                >
             SR
                </Avatar>
          )}
              title="Statement Review"
              subheader={`created by ${name || getUsername(context)}`}
            />
          </div>
          <Divider />
          <CardContent>
            <Typography variant="h5" gutterBottom align="center" color="secondary">
              {`Status: ${status}`}
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center">
              {comment}
            </Typography>
            <div className="review-card__action-button">
              {variant === 'edit' && (
                <ActionButton
                  onClick={() => handleDelete(content, index)}
                  variant="contained"
                  color="primary"
                  size="medium"
                  requireConfirm={false}
                >
                  Delete
                  <DeleteIcon />
                </ActionButton>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

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
            }}
            PopUpComponent={ReviewComp}
            PopUpProps={{ value, updateContent }}
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

EmbeddedRecordRow.propTypes = {
  updateContent: PropTypes.func.isRequired,
  variant: PropTypes.string,
  value: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  content: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  context: PropTypes.object.isRequired,
};

EmbeddedRecordRow.defaultProps = {
  variant: 'view',
};

export default EmbeddedRecordRow;
