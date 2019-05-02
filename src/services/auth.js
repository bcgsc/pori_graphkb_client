/**
 * Handles token storage and authentication.
 * @module /services/auth
 */
import Keycloak from 'keycloak-js';
import * as jwt from 'jsonwebtoken';
import fetchIntercept from 'fetch-intercept';

import config from '../static/config';

const {
  KEYCLOAK: {
    GRAPHKB_ROLE,
    REALM,
    CLIENT_ID,
    URL,
  },
  DISABLE_AUTH,
  API_BASE_URL,
} = config;

// must store the referring uri in local to get around the redirect
const KEYCLOAK_REFERRER = 'KEYCLOAK_REFERRER';
const dbRoles = {
  admin: 'admin',
  regular: 'regular',
  readonly: 'readonly',
};

/**
 * Checks expiry date on JWT token and compares with current time.
 */
const isExpired = (token) => {
  try {
    const expiry = jwt.decode(token).exp;
    return !Number.isNaN(expiry) && (expiry * 1000) < (new Date()).getTime();
  } catch (err) {
    return false;
  }
};

/**
 * Checks that the token is formatted properly and can be decoded
 */
const validToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    return !!decoded;
  } catch (err) {
    return false;
  }
};


class Authentication {
  constructor(opt = {}) {
    const {
      clientId = CLIENT_ID,
      realm = REALM,
      role = GRAPHKB_ROLE,
      url = URL,
      disableAuth = DISABLE_AUTH,
      referrerUriKey = KEYCLOAK_REFERRER,
    } = opt;
    this.keycloak = Keycloak({
      realm,
      clientId,
      url,
      realm_access: { roles: [role] },
    });
    this.authorizationToken = null; // token for the authorization (db access)
    this.disableAuth = disableAuth;
    this.referrerUriKey = referrerUriKey;

    fetchIntercept.register({
      request: (fetchUrl, fetchConfig) => {
        if (fetchUrl.startsWith(API_BASE_URL)) {
          const newConfig = { ...fetchConfig };
          if (!newConfig.headers) {
            newConfig.headers = {};
          }
          newConfig.headers.Authorization = this.authorizationToken;
          return [fetchUrl, newConfig];
        }
        return [fetchUrl, fetchConfig];
      },
    });
  }

  get referrerUri() {
    return localStorage.getItem(this.referrerUriKey);
  }

  set referrerUri(uri) {
    if (uri === null) {
      localStorage.removeItem(this.referrerUriKey);
    } else {
      localStorage.setItem(this.referrerUriKey, uri);
    }
  }

  /**
   * Primarily used for display when logged in
   */
  get username() {
    if (this.authorizationToken) {
      return jwt.decode(this.authorizationToken).user.name;
    } if (this.keycloak.token) {
      return jwt.decode(this.keycloak.token).preferred_username;
    }
    return null;
  }

  get user() {
    try {
      return jwt.decode(this.authorizationToken).user;
    } catch {
      return null;
    }
  }

  /**
   * Returns true if the user has been sucessfully authenticated and the token is valid
   */
  isAuthenticated() {
    if (this.keycloak.token) {
      // check that the token is not expired
      return Boolean(validToken(this.keycloak.token) && !isExpired(this.keycloak.token));
    }
    return false;
  }

  isAuthorized() {
    if (this.isAuthenticated() || !this.disableAuth) {
      return Boolean(validToken(this.authorizationToken) && !isExpired(this.authorizationToken));
    }
    return false;
  }

  /**
   * Returns true if user is in the 'admin' usergroup.
   */
  isAdmin() {
    try {
      return Boolean(
        this.user.groups.find(group => group.name === dbRoles.admin),
      );
    } catch (err) {
      return false;
    }
  }

  hasWriteAccess() {
    try {
      return Boolean(
        this.user.groups.find(group => [dbRoles.admin, dbRoles.regular].includes(group.name)),
      );
    } catch (err) {
      return false;
    }
  }

  async login(referrerUri = null) {
    this.referrerUri = referrerUri;
    await this.keycloak.init({ onLoad: 'login-required', promiseType: 'native' });
  }

  async logout() {
    try {
      const resp = await this.keycloak.logout({ redirectUri: `${window.location.origin}/login` });
      return resp;
    } catch (err) {
      return err;
    }
  }
}


export { Authentication, isExpired, validToken };
