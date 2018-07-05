import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import './LoginView.css';
import {
  Button,
  Typography,
  TextField,
} from '@material-ui/core';
import api from '../../services/api';
import auth from '../../services/auth';

class LoginView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      invalid: false,
      error: null,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value, invalid: false });
  }

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
      })
      .catch(async (error) => {
        if (error.status === 401) {
          this.setState({ invalid: true });
        } else {
          this.setState({ error });
        }
      });
  }

  render() {
    const {
      username,
      password,
      invalid,
      error,
    } = this.state;

    const { loggedIn } = this.props;

    if (loggedIn) { return <Redirect push to="/query" />; }
    if (error) { return <Redirect push to={{ pathname: '/error', state: error }} />; }

    return (
      <div className="login-wrapper">
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

LoginView.defaultProps = {
  loggedIn: false,
};

LoginView.propTypes = {
  handleAuthenticate: PropTypes.func.isRequired,
  loggedIn: PropTypes.bool,
};

export default LoginView;
