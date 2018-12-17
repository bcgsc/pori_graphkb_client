/**
 * @module /views/ErrorView
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import './ErrorView.css';
import { Typography, Button, Tooltip } from '@material-ui/core';
import AssignmentIcon from '@material-ui/icons/Assignment';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import config from '../../static/config';

const { JIRA_LINK } = config;

/**
 * View for displaying uncaught error messages.
 */
class ErrorView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tooltip: false,
      error: null,
    };
  }

  /**
   * Initializes error message, or redirects to query page if none is present.
   */
  componentDidMount() {
    const { history } = this.props;
    const { state } = history.location;
    this.setState({ error: state });
  }

  render() {
    const {
      tooltip,
      error,
    } = this.state;
    if (!error) {
      return (
        <div className="error-wrapper" style={{ padding: '40vh 0' }}>
          <div className="error-content">
            <Typography variant="h4">Looks like you don&apos;t have any errors! &#x263A;</Typography>
          </div>
          <div className="error-content" id="return-link">
            <Link to="/">
              <Button variant="contained" color="primary">
                Home
              </Button>
            </Link>
          </div>
        </div>);
    }
    const {
      message,
      name,
      url,
      stacktrace,
      status,
      statusText,
    } = error;

    const jiraLink = <a rel="noopener noreferrer" target="_blank" href={JIRA_LINK}>KBDEV</a>;

    return (
      <div className="error-wrapper">
        <Typography variant="h1" id="error-header">
          Error
        </Typography>
        <div className="error-content">
          {(status || name) && (
            <Typography variant="h3">
              {`${status}: ${name}`}
            </Typography>
          )}
        </div>
        <div className="error-content">
          {(statusText || url) && (
            <div style={{ display: 'inline-flex', margin: 'auto' }}>
              {statusText && (
                <Typography variant="subtitle1">
                  {statusText}&nbsp;
                </Typography>
              )}
              {url && (
                <React.Fragment>
                  <Typography variant="subtitle1">
                    to URL&nbsp;
                  </Typography>
                  <Typography variant="subtitle1" color="error">
                    {url}
                  </Typography>
                </React.Fragment>)}
            </div>)}
        </div>
        <div className="error-content">
          <Typography variant="h6">
            {message}
          </Typography>
        </div>
        <div className="error-content">
          <Typography paragraph>
            Report this error in a JIRA ticket under the {jiraLink} project.
          </Typography>
        </div>
        <div id="spacer" />
        <div className="error-content" id="return-link">
          <Link to="/">
            <Button variant="contained" color="primary">
              Home
            </Button>
          </Link>
        </div>
        {stacktrace
          && (
            <div className="error-content stacktrace">
              <Tooltip
                title="Copied!"
                disableHoverListener
                open={tooltip}
                onClose={() => this.setState({ tooltip: false })}
              >
                <CopyToClipboard text={stacktrace} id="copy-button">
                  <Button
                    variant="outlined"
                    onClick={() => this.setState({ tooltip: true })}
                  >
                    Copy To Clipboard
                    <AssignmentIcon />
                  </Button>
                </CopyToClipboard>
              </Tooltip>
              <Typography variant="body1">
                Stacktrace:
              </Typography>
              <Typography variant="subtitle1" id="stacktrace-text">
                {stacktrace}
              </Typography>
            </div>)}
      </div>
    );
  }
}
/**
 * @namespace
 * @property {Object} history - Application routing history object.
 */
ErrorView.propTypes = {
  history: PropTypes.object.isRequired,
};

export default ErrorView;
