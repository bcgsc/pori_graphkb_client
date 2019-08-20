/**
 * @module /views/LoginView
 */
import React from 'react';
import PropTypes from 'prop-types';

import api from '../../services/api';
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
      from = location.state.from.pathname + location.state.from.search;
    } catch (err) {
      from = auth.referrerUri || '/query';
    }

    if (!auth.isAuthenticated()) {
      try {
        await auth.login(from);
      } catch (err) {
        // redirect to the error page
        history.push('/error', { error: { name: err.name, message: err.message } });
        return;
      }
    }

    if (!auth.isAuthorized()) {
      let call;
      if (auth.disableAuth !== true) {
        call = api.post('/token', { keyCloakToken: auth.keycloak.token });
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
