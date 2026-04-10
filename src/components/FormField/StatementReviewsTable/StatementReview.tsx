import '../index.scss';

import DeleteIcon from '@mui/icons-material/Delete';
import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  Divider,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';
import { useQuery } from 'react-query';

import ActionButton from '@/components/ActionButton';
import DetailChip from '@/components/DetailChip';
import { GeneralRecordType } from '@/components/types';
import { FORM_VARIANT, tuple } from '@/components/util';
import api from '@/services/api';

interface StatementReviewProps {
  index: number;
  onDelete: (arg: { index: number }) => void;
  /** single linked record or review */
  value: (Omit<GeneralRecordType, 'createdBy'> & { createdBy: string | GeneralRecordType });
  /** one of ['view', 'edit'] mode */
  variant?: FORM_VARIANT | '';
}

/**
 * Displays a linked record row + detail chip in EmbeddedListTable.
 */
const StatementReview = ({
  value,
  index,
  variant = FORM_VARIANT.VIEW,
  onDelete,
}: StatementReviewProps) => {
  const {
    status, createdBy, comment,
  } = value;

  let createdByRecord: GeneralRecordType | undefined;
  let createdByRid: string | undefined;

  if (typeof createdBy === 'string') {
    createdByRid = createdBy;
  } else if (createdBy) {
    createdByRid = createdBy['@rid'];
    createdByRecord = createdBy;
  }

  const { data: author = createdByRecord } = useQuery({
    queryKey: tuple('/query', { target: [createdByRid!] }),
    queryFn: ({ queryKey: [, body] }) => api.query(body),
    enabled: typeof createdBy === 'string',
    select: (response) => response[0],
  });

  const previewStr = `${author?.name} (${author?.['@rid']})`;

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
            subheader={`created by ${author?.name}`}
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

  const details = {} as Omit<typeof value, '@rid'>;
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
              variant: 'outlined',
              color: 'secondary',
            }}
            label={previewStr}
            PopUpComponent={ReviewComponent}
          />
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

export default StatementReview;
