/**
 * @module /views/LoginView
 */
import React from 'react';

import api from '@/services/api';
import { KBContext } from '@/components/KBContext';
import {
  isAuthenticated, getReferrerUri, login, keycloak, isAuthorized,
} from '@/services/auth';
import config from '@/static/config';
import { HistoryPropType, LocationPropType } from '@/components/types';

const {
  DISABLE_AUTH,
} = config;
/**
 * View to handle user authentication. Redirected to if at any point during use
 * the application receives a 401 error code from the server. Logs in by posting
 * user credentials to the api authentication endpoint, and stores the returned
 * token in browser localstorage.
 */
class LoginView extends React.Component {
  static contextType = KBContext;

  static propTypes = {
    history: HistoryPropType.isRequired,
    location: LocationPropType.isRequired,
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
    const {
      setAuthorizationToken, setAuthenticationToken,
    } = this.context;
    const { history, location } = this.props;
    let from;

    try {
      from = location.state.from.pathname + location.state.from.search;
    } catch (err) {
      from = getReferrerUri() || '/query';
    }

    if (!isAuthenticated(this.context)) {
      try {
        await login(from);
        setAuthenticationToken(keycloak.token);
      } catch (err) {
        // redirect to the error page
        history.push('/error', { error: { name: err.name, message: err.message } });
        return;
      }
    }

    if (!isAuthorized(this.context)) {
      let call;

      if (DISABLE_AUTH !== true) {
        call = api.post('/token', { keyCloakToken: keycloak.token });
      } else { // FOR TESTING ONLY
        console.warn('Authentication server is currently disabled by the client');
        call = api.post('/token', { username: process.env.USER, password: process.env.PASSWORD });
      }
      this.controllers.push(call);

      try {
        const response = await call.request();
        setAuthorizationToken(response.kbToken);
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
