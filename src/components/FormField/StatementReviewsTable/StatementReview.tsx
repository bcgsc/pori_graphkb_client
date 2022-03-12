import '../index.scss';

import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  Divider,
  TableCell,
  TableRow,
  Typography,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EmbeddedIcon from '@material-ui/icons/SelectAll';
import PropTypes from 'prop-types';
import React from 'react';
import { useQuery } from 'react-query';

import ActionButton from '@/components/ActionButton';
import DetailChip from '@/components/DetailChip';
import api from '@/services/api';

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
  const {
    status, createdBy, comment,
  } = value;

  const { data: author = createdBy } = useQuery(
    ['/query', { target: [createdBy] }],
    ({ queryKey: [route, body] }) => api.post(route, body),
    {
      enabled: !createdBy['@rid'],
      select: (response) => response[0],
    },
  );

  const previewStr = `${author.name} (${author['@rid']})`;

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
            subheader={`created by ${author.name}`}
            title="Statement Review"
          />
        </div>
        <Divider />
        <CardContent>
          <Typography align="center" color="secondary" gutterBottom variant="h5">
            {`Status: ${status}`}
          </Typography>
          <Typography align="center" color="textSecondary" variant="body1">
            {comment}
          </Typography>
          <div className="review-card__action-button">
            {variant === 'edit' && (
            <ActionButton
              color="primary"
              onClick={() => onDelete({ index })}
              requireConfirm={false}
              size="medium"
              variant="contained"
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
            label={previewStr}
            PopUpComponent={ReviewComponent}
            PopUpProps={{ onDelete }}
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
  index: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
  value: PropTypes.object.isRequired,
  variant: PropTypes.string,
};

StatementReview.defaultProps = {
  variant: 'view',
};

export default StatementReview;
