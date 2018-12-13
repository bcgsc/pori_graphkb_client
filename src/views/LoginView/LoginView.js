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
      unauthorized: false,
    };
  }

  /**
   * Checks if there is a timedout flag in passed state to notify user, then
   * updates parent component if user is logged out with handleLogOut.
   */
  async componentDidMount() {
    const { handleAuthenticate } = this.props;
    setTimeout(async () => {
      const token = await auth.login();
      try {
        const response = await api.post('/token', { keyCloakToken: token });
        auth.loadToken(response.kbToken);
        handleAuthenticate();
        history.push('/query');
      } catch (error) {
        this.setState({ unauthorized: true });
      }
    }, 0);
  }


  render() {
    const { unauthorized } = this.state;
    return unauthorized && (
      <div className="login-wrapper">
        <Typography variant="h5">
          You do not have access to the GraphKB Project. To gain access, please
          create a systems JIRA ticket or email graphkb@bcgsc.ca.
        </Typography>
        <Button
          id="redirect-btn"
          onClick={auth.logout}
          size="large"
          variant="contained"
          color="primary"
        >
          Back to login
        </Button>
      </div >
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
