/**
 * @module /views/LoginView
 */
import React from 'react';

import { SecurityContext } from '@/components/SecurityContext';
import { HistoryPropType, LocationPropType } from '@/components/types';
import api from '@/services/api';
import {
  getReferrerUri, isAuthenticated, isAuthorized,
  keycloak, login,
} from '@/services/auth';
import util from '@/services/util';

/**
 * View to handle user authentication. Redirected to if at any point during use
 * the application receives a 401 error code from the server. Logs in by posting
 * user credentials to the api authentication endpoint, and stores the returned
 * token in browser localstorage.
 */
class LoginView extends React.Component {
  static contextType = SecurityContext;

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
      const call = api.post('/token', { keyCloakToken: keycloak.token });
      this.controllers.push(call);

      try {
        const response = await call.request();
        setAuthorizationToken(response.kbToken);
      } catch (error) {
        // redirect to the error page
        console.error(error);
        util.handleErrorSaveLocation(error, history);
        return;
      }
    }
    const savedLocation = JSON.parse(localStorage.getItem('savedLocation'));

    if (savedLocation) {
      const { pathname, search } = savedLocation;
      localStorage.removeItem('savedLocation');
      history.push({
        pathname,
        search,
      });
    } else {
      history.push(from);
    }
  }

  componentWillUnmount() {
    this.controllers.forEach(c => c.abort());
  }

  render() {
    return null;
  }
}

export default LoginView;
