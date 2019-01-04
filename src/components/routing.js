import React from 'react';
import {
  Route,
  Redirect,
} from 'react-router-dom';
import PropTypes from 'prop-types';

import auth from '../services/auth';

/**
 * @returns {Route} a route component which checks authentication on render or redirects to login
 */
const AuthenticatedRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={props => (
      auth.isAuthorized()
        ? <Component {...props} />
        : (
          <Redirect to={{
            pathname: '/login',
            state: { from: props.location },
          }}
          />
        )
    )}
  />
);

AuthenticatedRoute.propTypes = {
  location: PropTypes.object.isRequired,
  component: PropTypes.object.isRequired,
};


/**
 * @returns {Route} a route component which checks for admin privledges on render or redirects to
 * login
 */
const AdminRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={props => (
      auth.isAuthorized() && auth.isAdmin()
        ? <Component {...props} />
        : (
          <Redirect to={{
            pathname: '/login',
            state: { from: props.location },
          }}
          />
        )
    )}
  />
);

AdminRoute.propTypes = {
  location: PropTypes.object.isRequired,
  component: PropTypes.object.isRequired,
};

export { AdminRoute, AuthenticatedRoute };
