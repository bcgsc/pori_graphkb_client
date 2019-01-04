/**
 * @module /views/LoginView
 */
import React from 'react';
import PropTypes from 'prop-types';
import './LoginView.scss';
import api from '../../services/api';
import auth from '../../services/auth';
import config from '../../static/config';

/**
 * View to handle user authentication. Redirected to if at any point during use
 * the application receives a 401 error code from the server. Logs in by posting
 * user credentials to the api authentication endpoint, and stores the returned
 * token in browser localstorage.
 */
class LoginView extends React.Component {
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
    const { history, location } = this.props;
    let from;
    try {
      from = location.state.from.pathname;
    } catch (err) {
      from = auth.popReferrerUri() || '/query';
    }

    if (!auth.isAuthenticated()) {
      await auth.authenticate(from);
    }

    try {
      if (!auth.isAuthorized()) {
        let call;
        if (config.DISABLE_AUTH !== true) {
          const token = auth.getAuthToken();
          call = api.post('/token', { keyCloakToken: token });
        } else { // FOR TESTING ONLY
          call = api.post('/token', { username: process.env.USER, password: process.env.PASSWORD });
        }
        this.controllers.push(call);
        const response = await call.request();
        auth.setToken(response.kbToken);
      }
    } catch (error) {
      // redirect to the error page
      console.error(error);
      history.push('/error', { error });
      return;
    }

    history.push(from);
  }

  componentWillUnmount() {
    this.controllers.forEach(c => c.abort());
  }

  static get propTypes() {
    return {
      history: PropTypes.object.isRequired,
      location: PropTypes.object.isRequired,
    };
  }

  render() {
    return null;
  }
}

export default LoginView;
