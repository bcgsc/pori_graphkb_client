import React, { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * View for user settings. Route is /user.
 * UNDER CONSTRUCTION
 */
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
};

export default UserView;
