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
import React from 'react';
import { useQuery } from 'react-query';

import ActionButton from '@/components/ActionButton';
import DetailChip from '@/components/DetailChip';
import { FORM_VARIANT, tuple } from '@/components/util';
import api from '@/services/api';

interface StatementReviewProps {
  index: number;
  label: string;
  onDelete: (arg: { index: number }) => void;
  /** single linked record or review */
  value: Record<string, unknown>;
  /** one of ['view', 'edit'] mode */
  variant?: FORM_VARIANT.EDIT | FORM_VARIANT.VIEW;
}

/**
 * Displays a linked record row + detail chip in EmbeddedListTable.
 */
const StatementReview = ({
  value,
  index,
  variant,
  onDelete,
  label,
}: StatementReviewProps) => {
  const {
    status, createdBy, comment,
  } = value;

  const { data: author = createdBy } = useQuery(
    tuple('/query', { target: [createdBy] }),
    ({ queryKey: [, body] }) => api.query(body),
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
            valueToString={(record) => {
              if (record && record.name) {
                return record.name;
              }
              if (record && record['@rid']) {
                return record['@rid'];
              }

              return `${record}`;
            }}
          />
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

StatementReview.defaultProps = {
  variant: FORM_VARIANT.VIEW,
};

export default StatementReview;
