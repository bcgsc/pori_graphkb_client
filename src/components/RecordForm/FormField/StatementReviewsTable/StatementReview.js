import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
  TableCell,
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
import { getUsername } from '../../../../services/auth';
import ActionButton from '../../../ActionButton';
import '../index.scss';
import { KBContext } from '../../../KBContext';

/**
 * Displays a linked record row + detail chip in EmbeddedListTable.
 *
 * @property {object} props.value single linked record or review
 * @property {string} props.variant one of ['view', 'edit'] mode
 * @property {object} props.content full record which has link to value
 * @property {function} props.onChange parent handler function to update record
 */
const StatementReview = ({
  value,
  index,
  variant,
  onDelete,
  label,
}) => {
  const context = useContext(KBContext);

  const {
    status, createdBy: { name: username }, createdBy, comment,
  } = value;

  const previewStr = username
    ? `${username} (${createdBy['@rid']})`
    : `${getUsername(context)} (#${createdBy})`;

  const ReviewComponent = () => (
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
            subheader={`created by ${username || getUsername(context)}`}
          />
        </div>
        <Divider />
        <CardContent>
          <Typography variant="h5" gutterBottom align="center" color="secondary">
            {`Status: ${status}`}
          </Typography>
          <Typography variant="body1" color="textSecondary" align="center">
            {comment}
          </Typography>
          <div className="review-card__action-button">
            {variant === 'edit' && (
            <ActionButton
              onClick={() => onDelete({ index })}
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

  const details = {};
  Object.keys(value).forEach((prop) => {
    if (prop !== '@rid') {
      details[prop] = value[prop];
    }
  });

  return (
    <React.Fragment key={index}>
      <TableRow>
        <TableCell size="small">
          {status}
        </TableCell>
        <TableCell>
          <DetailChip
            ChipProps={{
              avatar: (<Avatar><EmbeddedIcon /></Avatar>),
              variant: 'outlined',
              color: 'secondary',
            }}
            PopUpComponent={ReviewComponent}
            PopUpProps={{ onDelete }}
            label={previewStr}
            title={label}
            value={details}
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

StatementReview.propTypes = {
  onDelete: PropTypes.func.isRequired,
  variant: PropTypes.string,
  value: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
};

StatementReview.defaultProps = {
  variant: 'view',
};

export default StatementReview;
