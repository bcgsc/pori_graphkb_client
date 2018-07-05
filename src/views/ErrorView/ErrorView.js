import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Link } from 'react-router-dom';
import './ErrorView.css';
import { Typography, Button } from '@material-ui/core';
import queryString from 'query-string';

function ErrorView(props) {
  const { location } = props;

  const { status, text, message } = queryString.parse(location.search);
  if (!status && !text && !message) return <Redirect push to="/query" />;

  return (
    <div className="error-wrapper">
      <div className="error-content">
        <Typography variant="display4" id="error-header">
          Error
        </Typography>
      </div>
      <div className="error-content">
        <Typography variant="display2" className="error-content">
          {`${status} ${message ? `: ${message}` : ''}`}
        </Typography>
      </div>

      <div className="error-content">
        <Typography variant="title" className="error-content" id="error-text">
          {text}
        </Typography>
      </div>
      <div id="spacer" />
      <div className="error-content" id="return-link">
        <Link to="/query">
          <Button>
            Back to Query
          </Button>
        </Link>
      </div>
    </div>
  );
}

ErrorView.propTypes = {
  location: PropTypes.object.isRequired,
};

export default ErrorView;
