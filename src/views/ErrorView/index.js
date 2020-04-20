/**
 * @module /views/ErrorView
 */

import './index.scss';

import { Button, Tooltip, Typography } from '@material-ui/core';
import AssignmentIcon from '@material-ui/icons/Assignment';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
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
class ErrorView extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
    location: LocationPropType.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { tooltipOpen: false };
  }

  render() {
    const { location: { state }, history } = this.props;
    const { from: { pathname, search } } = state;

    const { tooltipOpen } = this.state;

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
                onClose={() => this.setState({ tooltipOpen: false })}
                open={tooltipOpen}
                title="Copied!"
              >
                <CopyToClipboard id="copy-button" text={errorDetails}>
                  <Button
                    onClick={() => this.setState({ tooltipOpen: true })}
                    variant="outlined"
                  >
                    Copy To Clipboard
                    <AssignmentIcon />
                  </Button>
                </CopyToClipboard>
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
  }
}

export default ErrorView;
