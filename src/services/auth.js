/**
 * Handles token storage and authentication.
 * @module /services/auth
 */
import Keycloak from 'keycloak-js';
import * as jwt from 'jsonwebtoken';

import config from '../static/config';

const {
  KEYCLOAK: {
    GRAPHKB_ROLE,
    REALM,
    CLIENT_ID,
    URL,
  },
  DISABLE_AUTH,
} = config;

// must store the referring uri in local to get around the redirect
const KEYCLOAK_REFERRER = 'KEYCLOAK_REFERRER';
const dbRoles = {
  admin: 'admin',
  regular: 'regular',
  readonly: 'readonly',
};

const keycloak = Keycloak({
  realm: REALM,
  clientId: CLIENT_ID,
  url: URL,
  realm_access: { roles: [GRAPHKB_ROLE] },
});

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


const getReferrerUri = () => localStorage.getItem(KEYCLOAK_REFERRER);

const setReferrerUri = (uri) => {
  if (uri === null) {
    localStorage.removeItem(KEYCLOAK_REFERRER);
  } else {
    localStorage.setItem(KEYCLOAK_REFERRER, uri);
  }
};

/**
 * Primarily used for display when logged in
 */
const getUsername = ({ authorizationToken, authenticationToken }) => {
  if (authorizationToken) {
    return jwt.decode(authorizationToken).user.name;
  } if (authenticationToken || keycloak.token) {
    return jwt.decode(authenticationToken || keycloak.token).preferred_username;
  }
  return null;
};

const getUser = ({ authorizationToken }) => {
  try {
    return jwt.decode(authorizationToken).user;
  } catch {
    return null;
  }
};

/**
 * Returns true if the user has been sucessfully authenticated and the token is valid
 */
const isAuthenticated = ({ authenticationToken }) => {
  const token = authenticationToken || keycloak.token;
  if (token) {
    // check that the token is not expired
    return Boolean(validToken(token) && !isExpired(token));
  }
  return false;
};

const isAuthorized = ({ authorizationToken, authenticationToken }) => {
  if (isAuthenticated({ authenticationToken }) || !DISABLE_AUTH) {
    return Boolean(validToken(authorizationToken) && !isExpired(authorizationToken));
  }
  return false;
};

/**
 * Returns true if user is in the 'admin' usergroup.
 */
const isAdmin = ({ authorizationToken }) => {
  try {
    return Boolean(
      getUser({ authorizationToken }).groups.find(group => group.name === dbRoles.admin),
    );
  } catch (err) {
    return false;
  }
};

const hasWriteAccess = ({ authorizationToken }) => {
  try {
    return Boolean(
      getUser({ authorizationToken }).groups.find(group => [dbRoles.admin, dbRoles.regular].includes(group.name)),
    );
  } catch (err) {
    return false;
  }
};

const login = async (referrerUri = null) => {
  setReferrerUri(referrerUri);
  const init = new Promise((resolve, reject) => {
    const prom = keycloak.init({ onLoad: 'login-required' }); // setting promiseType = native does not work for later functions inside the closure
    prom.success(resolve);
    prom.error(reject);
  });
  await init;
};

const logout = async () => {
  setReferrerUri(null);
  try {
    const resp = await keycloak.logout({ redirectUri: `${window.location.origin}/login` });
    return resp;
  } catch (err) {
    return err;
  }
};


export {
  login, logout, hasWriteAccess, isAdmin, isAuthorized, isAuthenticated, isExpired, validToken, getUser, getUsername, getReferrerUri, keycloak,
};
