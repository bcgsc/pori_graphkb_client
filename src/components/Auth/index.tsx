import './index.scss';

import { Button, CircularProgress, Typography } from '@material-ui/core';
import fetchIntercept from 'fetch-intercept';
import jwtDecode from 'jwt-decode';
import Keycloak from 'keycloak-js';
import React, {
  createContext, ReactNode, useContext, useEffect, useLayoutEffect, useMemo,
} from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';

import api from '@/services/api';

import { GeneralRecordType } from '../types';

const dbRoles = {
  admin: 'admin',
  regular: 'regular',
  readonly: 'readonly',
};

const keycloak = new Keycloak({
  realm: window._env_.KEYCLOAK_REALM,
  clientId: window._env_.KEYCLOAK_CLIENT_ID,
  url: window._env_.KEYCLOAK_URL,
});

interface DecodedKBToken {
  user: GeneralRecordType & {
    '@rid': string;
    signedLicenseAt?: string | null;
    name: string;
    groups: { name: string }[];
  };
}

interface AuthContextState {
  login: () => void;
  logout: () => void;
  error: unknown | undefined;
  isAuthenticating: boolean;
  authenticationToken?: string;
  authorizationToken?: string;
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  hasWriteAccess?: boolean;
  user?: DecodedKBToken['user'];
  username?: string;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

const useAuth = () => {
  const state = useContext(AuthContext);

  if (!state) {
    throw new Error('context provider for AuthContext is missing');
  }

  return state;
};

const AuthProvider = (props: { children: ReactNode }) => {
  const { children } = props;

  const {
    mutate: logInOrOut, isLoading: isAuthenticating, data, error,
  } = useMutation(
    async ({ loggingIn }: { loggingIn: boolean }) => {
      if (loggingIn) {
        const loggedIn = await keycloak.init({
          checkLoginIframe: false,
          enableLogging: true,
          onLoad: 'login-required',
        });

        if (!loggedIn) {
          await keycloak.login({ redirectUri: window.location.href });
        }

        const { kbToken: authorizationToken } = await api.authenticate(keycloak.token);
        const { user } = jwtDecode<DecodedKBToken>(authorizationToken);

        await keycloak.loadUserInfo();
        // eslint-disable-next-line camelcase
        const username = keycloak.userInfo?.preferred_username || user?.name;

        return {
          authenticationToken: keycloak.token,
          authorizationToken,
          isAuthenticated: true,
          isAdmin: Boolean(user.groups.find((group) => group.name === dbRoles.admin)),
          hasWriteAccess: Boolean(user.groups.find((group) => [dbRoles.admin, dbRoles.regular].includes(group.name))),
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

const Centered = ({ children }: { children: ReactNode }) => (
  <div className="auth-centered">
    {children}
  </div>
);

interface AuthenticatedRouteProps {
  component: React.ComponentType<any>;
  componentProps?: any;
  admin?: boolean;
  signedLicenseRequired?: boolean;
}

const AuthenticatedRoute = (props: AuthenticatedRouteProps) => {
  const {
    admin,
    signedLicenseRequired,
    component: Comp,
    componentProps = {},
  } = props;
  const auth = useAuth();
  const navigate = useNavigate();

  const routeChange = () => {
    const path = '/about/terms';
    navigate(path);
  };

  useLayoutEffect(() => {
    if (!auth.isAuthenticating && !auth.isAuthenticated && !auth.error) {
      auth.login();
    }
  }, [auth]);

  if (auth.error) {
    return (
      <Centered>
        <Typography color="error" gutterBottom variant="h2">Error Authenticating</Typography>
        <Typography paragraph>An Error occurred while authenticating. please logout and try again or contact your administrator if the problem persists</Typography>
        <Typography paragraph>{auth.error?.message}</Typography>
        <Button onClick={auth.logout}>logout</Button>
      </Centered>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <Centered>
        <CircularProgress />
      </Centered>
    );
  }

  if (admin && !auth.isAdmin) {
    return (
      <Centered>
        <Typography color="error" gutterBottom variant="h2">Forbidden</Typography>
        <Typography paragraph>You do not have sufficient permissions to see this page.</Typography>
      </Centered>
    );
  }

  if (signedLicenseRequired && !auth.user?.signedLicenseAt) {
    return (
      <Centered>
        <Typography color="error" gutterBottom variant="h2">Forbidden</Typography>
        <Typography paragraph>User must sign the license agreement before they can access data.</Typography>
        <Button onClick={routeChange}>Terms of Use and License Agreement</Button>
      </Centered>
    );
  }
  const cp = componentProps || {};

  return <Comp {...cp} />;
};

AuthenticatedRoute.defaultProps = {
  admin: false,
  signedLicenseRequired: false,
  componentProps: {},
};

export {
  AuthContext,
  AuthenticatedRoute,
  AuthProvider,
  useAuth,
};
