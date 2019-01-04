/**
 * Handles token storage and authentication.
 * @module /services/auth
 */
import Keycloak from 'keycloak-js';
import * as jwt from 'jsonwebtoken';

import config from '../static/config';

const {
  KEYS: {
    KB_TOKEN,
    KEYCLOAK_TOKEN,
  },
  KEYCLOAK: {
    GRAPHKB_ROLE,
    REALM,
    CLIENT_ID,
    URL,
  },
} = config;

const REFERRER = 'KEYCLOAK_LOGIN_REFERRER';


const keycloak = Keycloak({
  realm: REALM,
  clientId: CLIENT_ID,
  url: URL,
  realm_access: { roles: [GRAPHKB_ROLE] },
});

/**
 * Returns the keycloak token.
 */
const getAuthToken = () => localStorage.getItem(KEYCLOAK_TOKEN);

/**
 * Loads KeyCloak token into localstorage.
 */
const setAuthToken = token => localStorage.setItem(KEYCLOAK_TOKEN, token);

/**
 * Retrieves Knowledge Base token.
 */
const getToken = () => localStorage.getItem(KB_TOKEN);

/**
 * Get and remove last refferer
 */
const popReferrerUri = () => {
  const uri = localStorage.getItem(REFERRER);
  localStorage.removeItem(REFERRER);
  return uri;
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


const validToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    console.warn(decoded);
    return !!decoded;
  } catch (err) {
    return false;
  }
};

/**
 * User has a valid token from the authentication server (keycloak)
 */
const isAuthenticated = () => {
  const token = getAuthToken();
  return !!(validToken(token) && !isExpired(token));
};

/**
 * User has a valid token from the database server
 */
const isAuthorized = () => {
  const token = getToken();
  console.warn('author token', token, !!token, token === 'undefined');
  return !!(validToken(token) && !isExpired(token));
};

/**
 * Loads new Knowledge Base token into localstorage.
 * @param {string} token - New Knowledge Base token.
 */
const setToken = (token) => {
  localStorage.setItem(KB_TOKEN, token);
};

/**
 * Clears Knowledge Base token from localstorage.
 */
const clearTokens = () => {
  localStorage.removeItem(KB_TOKEN);
  localStorage.removeItem(KEYCLOAK_TOKEN);
};

/**
 * Returns username of currently logged in user.
 */
const getUser = () => {
  try {
    return jwt.decode(getToken()).user;
  } catch (err) {
    return null;
  }
};

/**
 * Returns true if user is in the 'admin' usergroup.
 */
const isAdmin = () => {
  try {
    return !!(
      isAuthorized()
      && jwt.decode(getToken()).user.groups.find(group => group.name === 'admin')
    );
  } catch (err) {
    return false;
  }
};

/**
 * Redirects to keycloak login page, sets token into localstorage once returned.
 */
const authenticate = async (referrerUri = null) => {
  clearTokens();
  localStorage.setItem(REFERRER, referrerUri);
  await keycloak.init({ onLoad: 'login-required', promiseType: 'native' });
  setAuthToken(keycloak.token);
  return keycloak.token;
};

/**
 * Clears tokens and redirects user to keycloak login page. On successful login
 * routes to /login.
 */
const logout = async () => {
  clearTokens();
  try {
    await keycloak.init({ promiseType: 'native' });
    const resp = await keycloak.logout({ redirectUri: `${window.location.origin}/login` });
    return resp;
  } catch (err) {
    return err;
  }
};


export default {
  authenticate,
  getAuthToken,
  getToken,
  getUser,
  GRAPHKB_ROLE,
  isAdmin,
  isAuthenticated,
  isAuthorized,
  setToken,
  logout,
  popReferrerUri,
};
