import React, { useContext } from 'react';
import {
  Route,
  Redirect,
} from 'react-router-dom';
import { PropTypes } from 'prop-types';

import { KBContext } from './KBContext';
import { isAuthenticated, isAdmin } from '@/services/auth';
import { LocationPropType } from './types';

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
    ChildComponent = (props) => {
      const { location } = props;
      return (
        <Redirect to={{
          pathname: '/login',
          state: { from: location },
        }}
        />
      );
    };
  } else if (admin && !adminOk) {
    ChildComponent = () => (
      <Redirect to="/" />
    );
  } else {
    ChildComponent = Component;
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
