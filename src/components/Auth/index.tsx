import './index.scss';

import { Button, CircularProgress, Typography } from '@material-ui/core';
import fetchIntercept from 'fetch-intercept';
import jwtDecode from 'jwt-decode';
import Keycloak from 'keycloak-js';
import { PropTypes } from 'prop-types';
import React, {
  createContext, useContext, useEffect, useLayoutEffect, useMemo,
} from 'react';
import { useMutation } from 'react-query';
import { Route } from 'react-router-dom';

import api from '@/services/api';

const dbRoles = {
  admin: 'admin',
  regular: 'regular',
  readonly: 'readonly',
};

const keycloak = Keycloak({
  realm: window._env_.KEYCLOAK_REALM,
  clientId: window._env_.KEYCLOAK_CLIENT_ID,
  url: window._env_.KEYCLOAK_URL,
  realm_access: { roles: [window._env_.KEYCLOAK_ROLE] },
});

const AuthContext = createContext(undefined);

const useAuth = () => {
  const state = useContext(AuthContext);

  if (!state) {
    throw new Error('context provider for AuthContext is missing');
  }

  return state;
};

const AuthProvider = (props) => {
  const { children } = props;

  const {
    mutate: logInOrOut, isLoading: isAuthenticating, data, error,
  } = useMutation(
    async ({ loggingIn }) => {
      if (loggingIn) {
        const loggedIn = await keycloak.init({
          checkLoginIframe: false,
          enableLogging: true,
          onLoad: 'login-required',
        });

        if (!loggedIn) {
          await keycloak.login({ redirectUri: window.location.href });
        }

        const { kbToken: authorizationToken } = await api.post('/token', { keyCloakToken: keycloak.token });
        const { user } = jwtDecode(authorizationToken);

        await keycloak.loadUserInfo();
        // eslint-disable-next-line camelcase
        const username = keycloak.userInfo?.preferred_username || user?.name;

        return {
          authenticationToken: keycloak.token,
          authorizationToken,
          isAuthenticated: true,
          isAdmin: Boolean(user.groups.find(group => group.name === dbRoles.admin)),
          hasWriteAccess: Boolean(user.groups.find(group => [dbRoles.admin, dbRoles.regular].includes(group.name))),
          user,
          username,
        };
      }

      await keycloak.logout();
      return undefined;
    },
  );

  const { authorizationToken } = data ?? {};

  useEffect(() => {
    const unregister = fetchIntercept.register({
      request: (fetchUrl, fetchConfig) => {
        if (fetchUrl.startsWith(window._env_.API_BASE_URL)) {
          const newConfig = { ...fetchConfig };

          if (!newConfig.headers) {
            newConfig.headers = {};
          }
          newConfig.headers.Authorization = authorizationToken;
          return [fetchUrl, newConfig];
        }
        return [fetchUrl, fetchConfig];
      },
    });
    return unregister;
  }, [authorizationToken]);

  const auth = useMemo(() => ({
    login: () => {
      if (!isAuthenticating) {
        logInOrOut({ loggingIn: true });
      }
    },
    logout: () => {
      if (!isAuthenticating) {
        logInOrOut({ loggingIn: false });
      }
    },
    isAuthenticating,
    error,
    ...data || {},
  }), [data, isAuthenticating, logInOrOut, error]);

  return (
    <AuthContext.Provider
      value={auth}
    >
      {children}
    </AuthContext.Provider>
  );
};
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

const Centered = ({ children }) => (
  <div className="auth-centered">
    {children}
  </div>
);
Centered.propTypes = {
  children: PropTypes.node.isRequired,
};

const AuthenticatedRoute = (props) => {
  const { admin, component, path } = props;
  const auth = useAuth();

  useLayoutEffect(() => {
    if (!auth.isAuthenticating && !auth.isAuthenticated && !auth.error) {
      auth.login();
    }
  }, [auth]);

  if (auth.error) {
    return (
      <Route
        path={path}
      >
        <Centered>
          <Typography color="error" gutterBottom variant="h2">Error Authenticating</Typography>
          <Typography paragraph>An Error occurred while authenticating. please logout and try again or contact your administrator if the problem persists</Typography>
          <Typography paragraph>{auth.error?.message}</Typography>
          <Button onClick={auth.logout}>logout</Button>
        </Centered>
      </Route>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <Route
        path={path}
      >
        <Centered>
          <CircularProgress />
        </Centered>
      </Route>
    );
  }

  if (admin && !auth.isAdmin) {
    return (
      <Route
        path={path}
      >
        <Centered>
          <Typography color="error" gutterBottom variant="h2">Forbidden</Typography>
          <Typography paragraph>You do not have sufficient permissions to see this page.</Typography>
        </Centered>
      </Route>
    );
  }

  return (
    <Route component={component} path={path} />
  );
};

AuthenticatedRoute.propTypes = {
  component: PropTypes.object.isRequired,
  path: PropTypes.string.isRequired,
  admin: PropTypes.bool,
};

AuthenticatedRoute.defaultProps = {
  admin: false,
};

export {
  AuthContext,
  AuthenticatedRoute,
  AuthProvider,
  useAuth,
};
