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


const keycloak = Keycloak({
  realm: REALM,
  clientId: CLIENT_ID,
  url: URL,
  realm_access: { roles: [GRAPHKB_ROLE] },
});

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
  const token = getToken();
  try {
    const expiry = jwt.decode(token).exp;
    return !Number.isNaN(expiry) && (expiry * 1000) < (new Date()).getTime();
  } catch (err) {
    return false;
  }
};

const isAuthenticated = () => getToken() && !isExpired();

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
      isAuthenticated()
      && jwt.decode(getToken()).user.groups.find(group => group.name === 'admin')
    );
  } catch (err) {
    return false;
  }
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
    await keycloak.init({ promiseType: 'native' });
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
  isAuthenticated,
  isExpired,
  getUser,
  clearToken,
};
