/**
 * @module /views/LoginView
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './LoginView.scss';
import {
  Button,
  Typography,
} from '@material-ui/core';
import api from '../../services/api';
import auth from '../../services/auth';
import history from '../../services/history';
import config from '../../static/config';

const { FEEDBACK_EMAIL } = config;

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
    this.controllers = [];
  }

  /**
   * Sends user to log in to keycloak then checks token validity against api.
   * Redirects to /query if successful, displays unauthorized message
   * otherwise.
   */
  async componentDidMount() {
    const { handleAuthenticate } = this.props;
    // Clear event loop
    if (auth.isExpired()) {
      await auth.logout();
    }
    if (auth.getKeyCloakToken() && auth.getToken()) {
      handleAuthenticate();
      history.push('/query');
      return;
    }

    let call;
    if (config.DISABLE_AUTH !== true) { // FOR NOT TESTING
      const token = await auth.login();
      call = api.post('/token', { keyCloakToken: token });
    } else {
      call = api.post('/token', { username: process.env.USER, password: process.env.PASSWORD });
    }
    try {
      this.controllers.push(call);
      const response = await call.request();
      auth.loadToken(response.kbToken);
      history.push('/query');
    } catch (error) {
      this.setState({ unauthorized: true });
    } finally {
      handleAuthenticate();
    }
  }

  componentWillUnmount() {
    this.controllers.forEach(c => c.abort());
  }

  render() {
    const { unauthorized } = this.state;
    const emailLink = <a href={`mailto:${FEEDBACK_EMAIL}`}>{FEEDBACK_EMAIL}</a>;
    return unauthorized && (
      <div className="login-wrapper">
        <Typography variant="h5">
          You do not have access to the GraphKB Project. To gain access, please
          create a systems JIRA ticket or email {emailLink}.
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
      </div>
    );
  }
}

/**
 * @namespace
 * @property {function} handleAuthenticate - Updates parent state on successful login.
 */
LoginView.propTypes = {
  handleAuthenticate: PropTypes.func.isRequired,
};

export default LoginView;
