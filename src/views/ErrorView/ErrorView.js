/**
 * @module /views/ErrorView
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Typography, Button, Tooltip } from '@material-ui/core';
import AssignmentIcon from '@material-ui/icons/Assignment';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import './ErrorView.scss';
import config from '../../static/config';
import { LocationPropType } from '../../components/types';

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
  linkText: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
  subject: PropTypes.string.isRequired,
};

/**
 * View for displaying uncaught error messages.
 */
class ErrorView extends Component {
  static propTypes = {
    location: LocationPropType.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { tooltipOpen: false };
  }

  render() {
    const { location: { state } } = this.props;
    const { tooltipOpen } = this.state;

    const {
      error: {
        message = 'This is the default page where errors are reported if encountered',
        name = 'No Error Reported',
        stacktrace = '',
        ...rest
      } = {},
    } = state;

    const jiraLink = <a rel="noopener noreferrer" target="_blank" href={JIRA_LINK}>JIRA</a>;

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
            Report this error in a {jiraLink} ticket or email us at
          <EmailReportError
            linkText={EMAIL}
            subject={`${name}: ${message}`}
            body={errorDetails}
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
                title="Copied!"
                disableHoverListener
                open={tooltipOpen}
                onClose={() => this.setState({ tooltipOpen: false })}
              >
                <CopyToClipboard text={errorDetails} id="copy-button">
                  <Button
                    variant="outlined"
                    onClick={() => this.setState({ tooltipOpen: true })}
                  >
                    Copy To Clipboard
                    <AssignmentIcon />
                  </Button>
                </CopyToClipboard>
              </Tooltip>
            </div>
          )}
        <Link to="/">
          <Button variant="contained" color="primary">
              Home
          </Button>
        </Link>
      </div>
    );
  }
}

export default ErrorView;
