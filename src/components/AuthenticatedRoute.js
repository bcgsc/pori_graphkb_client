import { PropTypes } from 'prop-types';
import React, { useContext } from 'react';
import {
  Redirect,
  Route,
} from 'react-router-dom';

import { KBContext } from '@/components/KBContext';
import { LocationPropType } from '@/components/types';
import { isAdmin, isAuthenticated } from '@/services/auth';

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
  component: PropTypes.object.isRequired,
  location: LocationPropType.isRequired,
  admin: PropTypes.bool,
};

AuthenticatedRoute.defaultProps = {
  admin: false,
};

export default AuthenticatedRoute;
