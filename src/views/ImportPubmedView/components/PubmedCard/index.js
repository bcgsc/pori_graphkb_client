import './index.scss';

import {
  Button, Card, CardActions, CardContent, IconButton,
  Typography,
} from '@material-ui/core';
import InputIcon from '@material-ui/icons/Input';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';

import schema from '@/services/schema';

import IFrame from '../IFrameLink';


const PUBMED_BASE_URL = 'https://www.ncbi.nlm.nih.gov/pubmed';

/**
 * @param {Object} props
 * @param {string} props.title the publication title
 * @param {string} props.sourceId the pubmed id
 * @param {string} props.recordId the record id in graphkb (if exsits)
 * @param {function} props.onClick the onClick handler function
 * @param {string} props.journalName the name of the journal the article was published in
 */
const PubmedCard = ({
  title, sourceId, recordId, onClick, journalName,
}) => (
  <Card className="pubmed-card" elevation={3}>
    <CardContent>
      <Typography color="textSecondary">
        PMID:{sourceId}
      </Typography>
      {title && (<Typography className="pubmed-card__title" variant="h2">{title}</Typography>)}
      {journalName && (
        <Typography variant="subtitle1">
          {journalName}
        </Typography>
      )}
      {!recordId && (
        <IFrame
          className="pubmed-iframe"
          title={`Article Preview for ${sourceId}`}
          url={`${PUBMED_BASE_URL}/${sourceId}`}
        />
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

PubmedCard.propTypes = {
  sourceId: PropTypes.string.isRequired,
  journalName: PropTypes.string,
  onClick: PropTypes.func,
  recordId: PropTypes.string,
  title: PropTypes.string,
};

PubmedCard.defaultProps = {
  onClick: () => {},
  journalName: '',
  recordId: null,
  title: '',
};

export default PubmedCard;