import React from 'react';
import {
  Route,
  Redirect,
} from 'react-router-dom';
import { PropTypes } from 'prop-types';

import { Authentication } from '../services/auth';
import { withKB } from './KBContext';

/**
 * @returns {Route} a route component which checks authentication on render or redirects to login
 */
const AuthenticatedRoute = ({
  component: Component, auth, admin, ...rest
}) => (
  <Route
    {...rest}
    render={props => (
      auth && auth.isAuthenticated() && (!admin || auth.isAdmin())
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
  admin: PropTypes.bool,
  component: PropTypes.object.isRequired,
  auth: PropTypes.instanceOf(Authentication).isRequired,
};

AuthenticatedRoute.defaultProps = {
  admin: false,
};

export default withKB(AuthenticatedRoute);
