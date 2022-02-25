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
import React, { useCallback } from 'react';
import { useQuery } from 'react-query';

import ActionButton from '@/components/ActionButton';
import DetailChip from '@/components/DetailChip';
import api from '@/services/api';

interface StatementReviewProps {
  index: number;
  label: string;
  onDelete: (arg: { index: number }) => void;
  value: object;
  /**
   * @default 'view'
   */
  variant?: 'view' | 'edit';
}

function StatementReview(props: StatementReviewProps) {
  const {
    value,
    index,
    variant,
    onDelete,
    label,
  } = props;
  const {
    status, createdBy, comment,
  } = value;

  const { data: author = createdBy } = useQuery(
    ['/query', { target: [createdBy] }] as const,
    ({ queryKey: [_, body] }) => api.query(body),
    {
      enabled: !createdBy['@rid'],
      select: (response) => response[0],
    },
  );

  const previewStr = `${author.name} (${author['@rid']})`;

  const ReviewComponent = useCallback(() => (
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
  ), [author.name, comment, index, onDelete, status, variant]);

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
            details={details}
            label={previewStr}
            PopUpComponent={ReviewComponent}
            PopUpProps={{ onDelete }}
            title={label}
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
}

StatementReview.defaultProps = {
  variant: 'view',
};

export default StatementReview;
