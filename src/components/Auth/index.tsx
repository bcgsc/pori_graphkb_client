import fetchIntercept from 'fetch-intercept';
import jwtDecode from 'jwt-decode';
import Keycloak from 'keycloak-js';
import React, { createContext, useContext } from 'react';
import { QueryClient } from 'react-query';
import { type MiddlewareFunction, createContext as createRouterContext } from 'react-router';

import api from '@/services/api';
import { AuthenticationError, AuthorizationError, SignedLicenseRequiredError } from '@/services/errors';

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

const logout = () => keycloak.logout();

interface DecodedKBToken {
  user: GeneralRecordType & {
    '@rid': string;
    signedLicenseAt?: number | null;
    name: string;
    groups: { name: string }[];
  };
}

export interface AuthContextState {
  isAdmin: boolean;
  hasWriteAccess: boolean;
  user: DecodedKBToken['user'];
  username: string;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

export const authContext = createRouterContext<AuthContextState>();

const useAuth = () => {
  const state = useContext(AuthContext);

  if (!state) {
    throw new Error('context provider for AuthContext is missing');
  }

  return state;
};

const authenticate = async (queryClient: QueryClient) => {
  const result = await queryClient.fetchQuery({
    queryKey: ['auth'],
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    queryFn: async () => {
      try {
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
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const username = (keycloak.userInfo as { preferred_username?: string } | undefined)?.preferred_username || user?.name;

        fetchIntercept.register({
          request: (fetchUrl, fetchConfig) => {
            if (fetchUrl.startsWith(window._env_.API_BASE_URL)) {
              return [fetchUrl, { ...fetchConfig, headers: { ...fetchConfig.headers, Authorization: authorizationToken } }];
            }
            return [fetchUrl, fetchConfig];
          },
        });

        return {
          isAdmin: Boolean(user.groups.find((group) => group.name === dbRoles.admin)),
          hasWriteAccess: Boolean(user.groups.find((group) => [dbRoles.admin, dbRoles.regular].includes(group.name))),
          user,
          username,
        };
      } catch (error) {
        throw new AuthenticationError(
          `An error occurred while authenticating. Please logout and try again or contact your administrator if the problem persists. ${error instanceof Error ? error.message : ''}`,
        );
      }
    },
  });
  return result;
};

export const createAuthMiddleware = (options: { requireSignedLicense?: boolean; requireAdmin?: boolean } = {}): MiddlewareFunction => async ({ context }, next) => {
  let auth: AuthContextState;

  try {
    auth = context.get(authContext);
  } catch (error) {
    auth = await authenticate(context.get(api.routerQueryContext));
    context.set(authContext, auth);
    console.error('Error retrieving auth context', error);
  }

  if (options.requireSignedLicense && !auth.user?.signedLicenseAt) {
    throw new SignedLicenseRequiredError('User must sign the license agreement before they can access data.');
  }

  if (options.requireAdmin && !auth.isAdmin) {
    throw new AuthorizationError('You do not have sufficient permissions to see this page.');
  }

  return next();
};

export {
  AuthContext,
  logout,
  useAuth,
};
