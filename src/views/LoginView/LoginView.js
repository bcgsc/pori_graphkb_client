/**
 * @module /views/LoginView
 */
import React from 'react';
import PropTypes from 'prop-types';

import api from '../../services/api';
import config from '../../static/config';
import { KBContext } from '../../components/KBContext';

/**
 * View to handle user authentication. Redirected to if at any point during use
 * the application receives a 401 error code from the server. Logs in by posting
 * user credentials to the api authentication endpoint, and stores the returned
 * token in browser localstorage.
 */
class LoginView extends React.Component {
  static contextType = KBContext;

  static propTypes = {
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.controllers = [];
  }

  /**
   * Sends user to log in to keycloak then checks token validity against api.
   * Redirects to /query if successful, displays unauthorized message
   * otherwise.
   */
  async componentDidMount() {
    const { auth } = this.context;
    const { history, location } = this.props;
    let from;
    try {
      from = location.state.from.pathname;
    } catch (err) {
      from = auth.popReferrerUri() || '/query';
    }

    if (!auth.isAuthenticated()) {
      await auth.login(from);
    }

    if (!auth.isAuthorized()) {
      let call;
      if (config.DISABLE_AUTH !== true) {
        const token = auth.authorizationToken;
        call = api.post('/token', { keyCloakToken: token });
      } else { // FOR TESTING ONLY
        console.warn('Authentication server is currently disabled by the client');
        call = api.post('/token', { username: process.env.USER, password: process.env.PASSWORD });
      }
      this.controllers.push(call);
      try {
        const response = await call.request();
        auth.authorizationToken = response.kbToken;
      } catch (error) {
        // redirect to the error page
        console.error(error);
        history.push('/error', { error: error.toJSON() });
        return;
      }
    }
    history.push(from);
  }

  componentWillUnmount() {
    this.controllers.forEach(c => c.abort());
  }

  render() {
    return null;
  }
}

export default LoginView;
