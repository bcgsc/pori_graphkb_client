import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import { Link, Redirect } from 'react-router-dom';
// import { Button } from '@material-ui/core';


class UserView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      changes: [],
    };
  }

  render() {
    const { changes } = this.state;
    const { children } = this.props;
    return (
      <div>
        {changes.map(() => (
          <h1>
            Change!
          </h1>))}
        {children}
      </div>
    );
  }
}

UserView.propTypes = {
  children: PropTypes.func.isRequired,
}
export default UserView;
