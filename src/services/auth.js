/**
 * Handles token storage and authentication.
 * @module /services/auth
 */
import Keycloak from 'keycloak-js';
import * as jwt from 'jsonwebtoken';
import config from '../static/config';

const { KEYS } = config;
const { KB_TOKEN, KEYCLOAK_TOKEN } = KEYS;

const keycloak = Keycloak({
  realm: 'TestKB', // TODO: Migrate over to production keycloak realm (will probably be something like "GSC")s
  clientId: 'GraphKB',
  url: 'http://ga4ghdev01.bcgsc.ca:8080/auth',
});

const GRAPHKB_ROLE = 'GraphKB';

/**
 * Returns decoded keycloak token.
 */
const getKeyCloakToken = () => jwt.decode(localStorage.getItem(KEYCLOAK_TOKEN));

/**
 * Loads KeyCloak token into localstorage.
 */
const loadKeyCloakToken = token => localStorage.setItem(KEYCLOAK_TOKEN, token);

/**
 * Retrieves Knowledge Base token.
 */
const getToken = () => localStorage.getItem(KB_TOKEN);

/**
 * Checks expiry date on JWT token and compares with current time.
 */
const isExpired = () => {
  const token = localStorage.getItem(KB_TOKEN);
  return !!(
    token
    && jwt.decode(token)
    && !Number.isNaN(jwt.decode(token).exp)
    && (jwt.decode(token).exp * 1000) < (new Date()).getTime()
  );
};

/**
 * Loads new Knowledge Base token into localstorage.
 * @param {string} token - New Knowledge Base token.
 */
const loadToken = (token) => {
  localStorage.setItem(KB_TOKEN, token);
};

/**
 * Clears Knowledge Base token from localstorage.
 */
const clearToken = () => {
  localStorage.removeItem(KB_TOKEN);
  localStorage.removeItem(KEYCLOAK_TOKEN);
};

/**
 * Returns username of currently logged in user.
 */
const getUser = () => {
  const token = localStorage.getItem(KB_TOKEN);
  if (token && jwt.decode(token)) {
    return jwt.decode(token).user;
  }
  return null;
};

/**
 * Returns true if user is in the 'admin' usergroup.
 */
const isAdmin = () => {
  const token = localStorage.getItem(KB_TOKEN);
  return !!(
    token
    && jwt.decode(token)
    && jwt.decode(token).user
    && jwt.decode(token).user.groups
    && jwt.decode(token).user.groups.find(group => group.name === 'admin')
  );
};

/**
 * Redirects to keycloak login page, loads token into localstorage once returned.
 */
const login = async () => {
  await keycloak.init({ onLoad: 'login-required', promiseType: 'native' });
  loadKeyCloakToken(keycloak.token);
  return keycloak.token;
};

/**
 * Clears tokens and redirects user to keycloak login page. On successful login
 * routes to /login.
 */
const logout = async () => {
  clearToken();
  try {
    keycloak.init();
    const resp = await keycloak.logout({ redirectUri: `${window.location.origin}/login` });
    return resp;
  } catch (err) {
    return err;
  }
};

export default {
  GRAPHKB_ROLE,
  login,
  logout,
  getToken,
  loadToken,
  loadKeyCloakToken,
  getKeyCloakToken,
  isAdmin,
  isExpired,
  getUser,
  clearToken,
};
