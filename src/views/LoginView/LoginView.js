import React, { Component } from "react";
import "./LoginView.css";
import { Button, Typography, TextField } from "@material-ui/core";
import { Redirect } from "react-router-dom";
import api from "../../services/api";
import auth from "../../services/auth";

class LoginView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      password: "",
      queryRedirect: false
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleSubmit(e) {
    e.stopPropagation();
    e.preventDefault();

    api
      .post("/token", {
        username: this.state.username,
        password: this.state.password
      })
      .then(response => {
        auth.loadToken(response.kbToken);
        this.setState({ queryRedirect: true });
      })
      .catch(error => {
        if (error === 401) {
          alert("Invalid Username or Password");
        }
      });
  }

  render() {
    if (this.state.queryRedirect) return <Redirect push to="/query" />;
    return (
      <div className="login-wrapper">
        <form className="login-form" onSubmit={this.handleSubmit}>
          <TextField
            className="login-input"
            name="username"
            value={this.state.username}
            onChange={this.handleChange}
            type="text"
            label="Username"
            required
          />
          <TextField
            className="login-input"
            name="password"
            value={this.state.password}
            onChange={this.handleChange}
            type="password"
            label="Password"
            required
          />
          <Button type="submit" color="primary" variant="raised">
            Login
          </Button>
          <Typography variant="caption" id="caption">
            Log in with your BC GSC web credentials
          </Typography>
        </form>
      </div>
    );
  }
}
export default LoginView;
