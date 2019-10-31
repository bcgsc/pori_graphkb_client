import React, { useContext } from 'react';
import {
  Route,
  Redirect,
} from 'react-router-dom';
import { PropTypes } from 'prop-types';

import { KBContext } from './KBContext';
import { isAuthenticated, isAdmin } from '../services/auth';
import { LocationPropType } from './prop-type-models';

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

  let ChildComponent;

  if (!authOk) {
    ChildComponent = props => (
      <Redirect to={{
        pathname: '/login',
        state: { from: props.location },
      }}
      />
    );
  } else if (admin && !adminOk) {
    ChildComponent = () => (
      <Redirect to="/" />
    );
  } else {
    ChildComponent = props => (<Component {...props} />);
  }
  return (
    <Route
      {...rest}
      render={props => (<ChildComponent {...props} />)}
    />
  );
};

AuthenticatedRoute.propTypes = {
  location: LocationPropType.isRequired,
  admin: PropTypes.bool,
  component: PropTypes.object.isRequired,
};

AuthenticatedRoute.defaultProps = {
  admin: false,
};

export default AuthenticatedRoute;
