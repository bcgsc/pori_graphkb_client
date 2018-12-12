/**
 * @module /views/LoginView
 */
/* eslint-disable */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './LoginView.css';
import {
  Button,
  Typography,
  TextField,
  Snackbar,
} from '@material-ui/core';
import api from '../../services/api';
import auth from '../../services/auth';
import history from '../../services/history';

/**
 * View to handle user authentication. Redirected to if at any point during use
 * the application receives a 401 error code from the server. Logs in by posting
 * user credentials to the api authentication endpoint, and stores the returned
 * token in browser localstorage.
 */
class LoginView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      initialized: false,
    };
  }

  /**
   * Checks if there is a timedout flag in passed state to notify user, then
   * updates parent component if user is logged out with handleLogOut.
   */
  async componentDidMount() {
    const { handleAuthenticate } = this.props;
    if (auth.getToken() && auth.isExpired()) {
      history.push('/query');
    } else {
      const token = await auth.login();
      const response = await api.post('/token', token);

      if (response) {
        handleAuthenticate();
        if (auth.isLoggedIn()) {
          history.push('/query');
        } else {
          this.setState({ initialized: true });
        }
      }
    }
  }


  render() {
    const { initialized } = this.state;
    return initialized && (
      <Typography>
        You do not have access to the GraphKB Project. Create a JIRA Ticket
        for systems in order to be added to GraphKB.
      </Typography>
    );
  }
}

/**
 * @namespace
 * @property {function} handleLogOut - Updates parent state on unauthorized user.
 * @property {function} handleAuthenticate - Updates parent state on successful login.
 */
LoginView.propTypes = {
  handleLogOut: PropTypes.func.isRequired,
  handleAuthenticate: PropTypes.func.isRequired,
};

export default LoginView;
