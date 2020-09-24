import { PropTypes } from 'prop-types';
import React, { useContext, useEffect } from 'react';
import {
  Redirect,
  Route,
} from 'react-router-dom';

import ActiveLinkContext from '@/components/ActiveLinkContext';
import { SecurityContext } from '@/components/SecurityContext';
import { LocationPropType } from '@/components/types';
import { isAdmin, isAuthenticated } from '@/services/auth';

/**
 * @returns {Route} a route component which checks authentication on render or redirects to login
 */
const AuthenticatedRoute = ({
  component: Component, admin, path, ...rest
}) => {
  const {
    autheticationToken, authorizationToken,
  } = useContext(SecurityContext);
  const { activeLink, setActiveLink } = useContext(ActiveLinkContext);

  useEffect(() => {
    if (path !== activeLink) {
      setActiveLink(path);
    }
  }, [activeLink, path, setActiveLink]);

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
    setActiveLink('/');
    ChildComponent = () => (
      <Redirect to="/" />
    );
  } else {
    ChildComponent = Component;
  }
  return (
    <Route
      path={path}
      {...rest}
      render={props => (<ChildComponent {...props} />)}
    />
  );
};

AuthenticatedRoute.propTypes = {
  component: PropTypes.object.isRequired,
  location: LocationPropType.isRequired,
  path: PropTypes.string.isRequired,
  admin: PropTypes.bool,
};

AuthenticatedRoute.defaultProps = {
  admin: false,
};

export default AuthenticatedRoute;
