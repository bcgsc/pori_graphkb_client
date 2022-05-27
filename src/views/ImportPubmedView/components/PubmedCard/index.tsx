import './index.scss';

import {
  Button, Card, CardActions, CardContent, IconButton,
  Typography,
} from '@material-ui/core';
import InputIcon from '@material-ui/icons/Input';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import React from 'react';
import { Link } from 'react-router-dom';

import schema from '@/services/schema';

const PUBMED_BASE_URL = 'https://pubmed.ncbi.nlm.nih.gov';

interface PubmedCardProps {
  /** the pubmed id */
  sourceId: string;
  /** the name of the journal the article was published in */
  journalName?: string;
  /** the onClick handler function */
  onClick?: React.ComponentProps<typeof Button>['onClick'];
  /** the record id in graphkb (if exsits) */
  recordId?: string;
  /** the publication title */
  title?: string;
}

const PubmedCard = ({
  title, sourceId, recordId, onClick, journalName,
}: PubmedCardProps) => (
  <Card className="pubmed-card" elevation={3}>
    <CardContent>
      <Typography color="textSecondary">
        PMID:{sourceId}
      </Typography>
      <a href={`${PUBMED_BASE_URL}/${sourceId}`} rel="noopener noreferrer" target="_blank">
        {`${PUBMED_BASE_URL}/${sourceId}`}
      </a>
      {title && (<Typography className="pubmed-card__title" variant="h2">{title}</Typography>)}
      {journalName && (
        <Typography variant="subtitle1">
          {journalName}
        </Typography>
      )}
    </CardContent>
    <CardActions className="pubmed-card__actions">
      {!recordId
        ? (
          <Button onClick={onClick}>Import&nbsp;<InputIcon /></Button>
        ) : (
          <Link
            target="_blank"
            to={schema.getLink({ '@rid': recordId, '@class': 'Publication' })}
          >
            <IconButton>
              <OpenInNewIcon />
            </IconButton>
          </Link>
        )}
    </CardActions>
  </Card>
);

PubmedCard.defaultProps = {
  onClick: () => {},
  journalName: '',
  recordId: null,
  title: '',
};

export default PubmedCard;
