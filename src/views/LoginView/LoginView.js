import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
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
 * Component for logging in function.
 */
class LoginView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      invalid: false,
      error: null,
      loggedIn: false,
      timedout: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    const { handleRedirect } = this.props;
    this.setState({ timedout: auth.isExpired() });
    handleRedirect();
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
  handleSubmit(e) {
    e.stopPropagation();
    e.preventDefault();

    const { username, password } = this.state;
    const { handleAuthenticate } = this.props;

    api
      .post('/token', {
        username,
        password,
      })
      .then((response) => {
        auth.loadToken(response.kbToken);
        handleAuthenticate();
        this.setState({ loggedIn: true });
      })
      .catch((error) => {
        if (error.status === 401) {
          this.setState({ invalid: true });
        } else {
          this.setState({ error });
        }
      });
  }

  /**
   * Renders the component.
   */
  render() {
    const {
      username,
      password,
      invalid,
      error,
      loggedIn,
      timedout,
    } = this.state;


    if (loggedIn) { return <Redirect push to="/query" />; }
    if (error) { return <Redirect push to={{ pathname: '/error', state: error }} />; }

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
          {invalid ? (
            <Typography variant="subheading" id="invalid-meessage">
              Invalid Username or Password
            </Typography>
          ) : null
          }
        </form>
      </div>
    );
  }
}

/**
 * @param {function} handleAuthenticate - function passed in from parent to handle a
 * successful log in.
 */
LoginView.propTypes = {
  handleAuthenticate: PropTypes.func.isRequired,
  handleRedirect: PropTypes.func.isRequired,
};

export default LoginView;
