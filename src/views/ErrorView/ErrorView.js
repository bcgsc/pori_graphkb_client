/**
 * @module /views/ErrorView
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import './ErrorView.css';
import { Typography, Button, Tooltip } from '@material-ui/core';
import AssignmentIcon from '@material-ui/icons/Assignment';

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

  componentDidMount() {
    const { history } = this.props;
    const { state } = history.location;
    if (!state) {
      history.push('/query');
    } else {
      this.setState({ error: state });
    }
  }

  render() {
    const {
      tooltip,
      error,
    } = this.state;
    const { history } = this.props;
    if (!error) return null;
    const {
      message,
      name,
      url,
      stacktrace,
      status,
      statusText,
    } = error;

    const methodText = `${statusText || ''} ${url ? `to url ${url}` : ''}`;

    return (
      <div className="error-wrapper">
        <Typography variant="h1" id="error-header">
          Error
        </Typography>
        <div className="error-content">
          <Typography variant="h3">
            {`${status}: ${name}`}
          </Typography>
        </div>
        <div className="error-content">
          <Typography variant="subtitle1">
            {methodText}
          </Typography>
        </div>
        <div className="error-content">
          <Typography variant="h6">
            {message}
          </Typography>
        </div>
        <div id="spacer" />
        <div className="error-content" id="return-link">
          <Button variant="contained" color="primary" onClick={history.back}>
            Back
          </Button>
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
