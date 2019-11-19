import React from 'react';
import {
  Card, CardActions, CardContent, Typography, Button, IconButton,
} from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import InputIcon from '@material-ui/icons/Input';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import IFrame from '../IFrameLink';
import schema from '../../../../services/schema';


import './index.scss';


const PUBMED_BASE_URL = 'https://www.ncbi.nlm.nih.gov/pubmed';


const PubmedCard = ({
  title, sourceId, recordId, onClick, journalName,
}) => (
  <Card className="pubmed-card" elevation={3}>
    <CardContent>
      <Typography color="textSecondary">
        PMID:{sourceId}
      </Typography>
      {title && (<Typography variant="h4" component="h2" className="pubmed-card__title">{title}</Typography>)}
      {journalName && (
        <Typography color="textSecondary">
          {journalName}
        </Typography>
      )}
      {!recordId && (
        <IFrame
          className="pubmed-iframe"
          url={`${PUBMED_BASE_URL}/${sourceId}`}
          title={`Article Preview for ${sourceId}`}
        />
      )}
    </CardContent>
    <CardActions className="pubmed-card__actions">
      {!recordId
        ? (
          <Button onClick={onClick}>Import&nbsp;<InputIcon /></Button>
        ) : (
          <Link
            to={schema.getLink({ '@rid': recordId, '@class': 'Publication' })}
            target="_blank"
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
  title: PropTypes.string,
  sourceId: PropTypes.string.isRequired,
  recordId: PropTypes.string,
  onClick: PropTypes.func,
  journalName: PropTypes.string,
};

PubmedCard.defaultProps = {
  onClick: () => {},
  journalName: '',
  recordId: null,
  title: '',
};

export default PubmedCard;
