/**
 * @module /views/LoginView
 */

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
      username: '',
      password: '',
      invalid: false,
      timedout: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  /**
   * Checks if there is a timedout flag in passed state to notify user, then
   * updates parent component if user is logged out with handleLogOut.
   */
  componentDidMount() {
    const { history, handleLogOut } = this.props;
    const { timedout } = history.location.state || {};
    if (!auth.getToken() || auth.isExpired()) {
      handleLogOut();
    }
    this.setState({ timedout: !!timedout });
  }

  /**
   * Updates component state based on user input.
   * @param {Event} e - Change event triggered from user inputs.
   */
  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value, invalid: false });
  }

  /**
   * Closes snackbar.
   */
  handleClose() {
    this.setState({ timedout: false });
  }

  /**
   * Makes authentication request to api.
   * @param {Event} e - Submit event.
   */
  async handleSubmit(e) {
    e.stopPropagation();
    e.preventDefault();

    const { username, password } = this.state;
    const { history, handleAuthenticate } = this.props;

    try {
      const response = await api.post('/token', {
        username,
        password,
      });
      auth.loadToken(response.kbToken);
      handleAuthenticate();
      history.push('/query');
    } catch (error) {
      if (error.status === 401) {
        this.setState({ invalid: true });
      }
    }
  }

  /**
   * Renders the component.
   */
  render() {
    const {
      username,
      password,
      invalid,
      timedout,
    } = this.state;

    return (
      <div className="login-wrapper">
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={timedout}
          onClose={this.handleClose}
          autoHideDuration={3000}
          message={(
            <span>
              Session timed out.
            </span>
          )}
        />

        <form className="login-form" onSubmit={this.handleSubmit}>
          <TextField
            className="login-input"
            name="username"
            value={username}
            onChange={this.handleChange}
            type="text"
            label="Username"
            required
            error={invalid}
          />
          <TextField
            className="login-input"
            name="password"
            value={password}
            onChange={this.handleChange}
            type="password"
            label="Password"
            required
            error={invalid}
          />
          <Button type="submit" color="primary" variant="raised">
            Login
          </Button>
          <Typography variant="caption" id="caption">
            Log in with your BC GSC web credentials
          </Typography>
          {invalid && (
            <Typography variant="subheading" id="invalid-meessage">
              Invalid Username or Password
            </Typography>
          )}
        </form>
      </div>
    );
  }
}

LoginView.propTypes = {
  /**
   * @param {object} history -  Application history object.
   */
  history: PropTypes.object.isRequired,
  /**
   * @param {function} handleLogOut - Updates parent state on unauthorized user.
   */
  handleLogOut: PropTypes.func.isRequired,
  /**
   * @param {function} handleAuthenticate - Updates parent state on successful login.
   */
  handleAuthenticate: PropTypes.func.isRequired,
};

export default LoginView;
