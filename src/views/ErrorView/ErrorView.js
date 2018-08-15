import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import './ErrorView.css';
import { Typography, Button, Tooltip } from '@material-ui/core';
import AssignmentIcon from '@material-ui/icons/Assignment';

/**
 * View for displaying uncaught error messages.
 * @param {Object} props - properties passed into the component.
 * @param {Object} props.history - history property for the route and passed state.
 * @param {Object} props.history.location.state - passed state from originator of redirect.
 */
class ErrorView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tooltip: false,
    };
  }

  render() {
    const { tooltip } = this.state;
    const { history } = this.props;
    const { state } = history.location;
    if (!state || (!state.status && !state.body)) history.push('/query');
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
              <Typography variant="subheading" id="stacktrace-text">
                {stacktrace}
              </Typography>
            </div>)}
      </div>
    );
  }
}

/**
* @param {Object} history - Application routing history object.
  */
ErrorView.propTypes = {
  history: PropTypes.object.isRequired,
};

export default ErrorView;
