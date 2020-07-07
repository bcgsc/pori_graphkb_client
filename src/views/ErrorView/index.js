/**
 * @module /views/ErrorView
 */

import './index.scss';

import { Button, Tooltip, Typography } from '@material-ui/core';
import AssignmentIcon from '@material-ui/icons/Assignment';
import { copy } from 'copy-to-clipboard';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

import { LocationPropType } from '@/components/types';
import config from '@/static/config';

const { FEEDBACK: { JIRA: JIRA_LINK, EMAIL } } = config;

const EmailReportError = (props) => {
  const { linkText, body, subject } = props;
  return (
    <a href={`mailto:${
      EMAIL
    }?subject=${
      encodeURIComponent(subject)
    }&body=${
      encodeURIComponent(body)
    }`}
    >
      {linkText}
    </a>
  );
};

EmailReportError.propTypes = {
  body: PropTypes.string.isRequired,
  linkText: PropTypes.string.isRequired,
  subject: PropTypes.string.isRequired,
};

/**
 * View for displaying uncaught error messages.
 */
const ErrorView = ({ location: { state }, history }) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const { from: { pathname, search } } = state;


  const {
    error: {
      message = 'This is the default page where errors are reported if encountered',
      name = 'No Error Reported',
      stacktrace = '',
      ...rest
    } = {},
  } = state;

  if (name === 'AuthenticationError') {
    const savedLocation = {
      pathname,
      search,
    };
    localStorage.setItem('savedLocation', JSON.stringify(savedLocation));

    history.push({
      pathname: '/login',
      state: { from: { pathname, search } },
    });
  }

  const jiraLink = <a href={JIRA_LINK} rel="noopener noreferrer" target="_blank">JIRA</a>;

  let errorDetails = `Error Details (Please include in error reports)
version: ${process.env.npm_package_version || process.env.REACT_APP_VERSION || ''}
error name: ${name}
error text: ${message}`;

  Object.entries(rest).forEach(([key, value]) => {
    if (value) {
      errorDetails = `${errorDetails}\n${key}: ${`${value}`.trim()}`;
    }
  });

  // TODO: Remove this after alpha testing
  if (stacktrace) {
    errorDetails = `${errorDetails}\n\nstack trace:\n\n${stacktrace}`;
  }

  const handleCopyToClipboard = useCallback(() => {
    setTooltipOpen(true);
    copy(errorDetails);
  }, [errorDetails]);

  return (
    <div className="error-wrapper">
      <Typography variant="h2">
        {name}
      </Typography>
      <Typography variant="h3">
        {message}
      </Typography>
      <Typography paragraph>
        Report this error in a {jiraLink} ticket or email us at&nbsp;
        <EmailReportError
          body={errorDetails}
          linkText={EMAIL}
          subject={`${name}: ${message}`}
        />
        .
      </Typography>
      {stacktrace
          && (
            <div className="stacktrace">
              <pre>
                <code>
                  {errorDetails}
                </code>
              </pre>
              <Tooltip
                disableHoverListener
                onClose={() => setTooltipOpen(false)}
                open={tooltipOpen}
                title="Copied!"
              >
                <Button
                  id="copy-button"
                  onClick={handleCopyToClipboard}
                  variant="outlined"
                >
                  Copy To Clipboard
                  <AssignmentIcon />
                </Button>
              </Tooltip>
            </div>
          )}
      <Link to="/">
        <Button color="primary" variant="contained">
          Home
        </Button>
      </Link>
    </div>
  );
};


ErrorView.propTypes = {
  history: PropTypes.object.isRequired,
  location: LocationPropType.isRequired,
};

export default ErrorView;
