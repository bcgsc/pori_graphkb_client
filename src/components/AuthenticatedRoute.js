import React, { useContext } from 'react';
import {
  Route,
  Redirect,
} from 'react-router-dom';
import { PropTypes } from 'prop-types';

import { KBContext } from './KBContext';
import { isAuthenticated, isAdmin } from '../services/auth';

/**
 * @returns {Route} a route component which checks authentication on render or redirects to login
 */
const AuthenticatedRoute = ({
  component: Component, admin, ...rest
}) => {
  const {
    autheticationToken, authorizationToken,
  } = useContext(KBContext);

  const authOk = isAuthenticated({ autheticationToken });
  const adminOk = isAdmin({ autheticationToken, authorizationToken });

  return (
    <Route
      {...rest}
      render={props => (
        authOk && (!admin || adminOk)
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
};

AuthenticatedRoute.propTypes = {
  location: PropTypes.object.isRequired,
  admin: PropTypes.bool,
  component: PropTypes.object.isRequired,
};

AuthenticatedRoute.defaultProps = {
  admin: false,
};

export default AuthenticatedRoute;
