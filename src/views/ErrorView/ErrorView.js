import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Link } from 'react-router-dom';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import './ErrorView.css';
import { Typography, Button } from '@material-ui/core';
import AssignmentIcon from '@material-ui/icons/Assignment';

/**
 * Component for viewing errors.
 * @param {Object} props - properties passed into the component.
 * @param {Object} props.location - location property for the route and passed state.
 * @param {Object} props.location.state - passed state from originator of redirect.
 */
function ErrorView(props) {
  const { location } = props;
  const { state } = location;
  if (!state || (!state.status && !state.body)) return <Redirect push to="/query" />;
  const { status, body } = state;

  const {
    error,
    message,
    method,
    name,
    url,
    stacktrace,
  } = body;

  const methodText = `${method ? `Method ${method}` : ''}${url ? `to url ${url}:` : ''}${message || ''}`;

  return (
    <div className="error-wrapper">
      <Typography variant="display4" id="error-header">
        Error
      </Typography>
      <div className="error-content">
        <Typography variant="display2">
          {`${status}: ${error || name}`}
        </Typography>
      </div>

      <div className="error-content">
        <Typography variant="title">
          {!error ? '' : name}
        </Typography>
      </div>
      <div className="error-content">
        <Typography variant="subheading">
          {methodText}
        </Typography>
      </div>
      <div id="spacer" />
      <div className="error-content" id="return-link">
        <Link to="/query">
          <Button variant="raised" color="primary">
            Back
          </Button>
        </Link>
      </div>
      {stacktrace
        ? (
          <div className="error-content stacktrace">
            <CopyToClipboard text={stacktrace} id="copy-button">
              <Button variant="outlined">
                Copy To Clipboard
                <AssignmentIcon />
              </Button>
            </CopyToClipboard>
            <Typography variant="subheading" id="stacktrace-text">
              {stacktrace}
            </Typography>
          </div>) : null}
    </div>
  );
}

ErrorView.propTypes = {
  location: PropTypes.object.isRequired,
};

export default ErrorView;
