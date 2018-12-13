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
  realm: 'TestKB',
  clientId: 'GraphKB',
  url: 'http://ga4ghdev01.bcgsc.ca:8080/auth',
});

const GRAPHKB_ROLE = 'GraphKB';

export default {
  GRAPHKB_ROLE,
  logout: async () => {
    localStorage.removeItem(KB_TOKEN);
    localStorage.removeItem(KEYCLOAK_TOKEN);
    try {
      await keycloak.init();
      const resp = await keycloak.logout();
      return resp;
    } catch (err) {
      return err;
    }
  },
  login: async () => {
    await keycloak.init({ onLoad: 'login-required', promiseType: 'native' });
    localStorage.setItem(KEYCLOAK_TOKEN, keycloak.token);
    return keycloak.token;
  },
  getKeyCloakToken: () => jwt.decode(localStorage.getItem(KEYCLOAK_TOKEN)),
  loadKeyCloakToken: token => localStorage.setItem(KEYCLOAK_TOKEN, token),
  /**
   * Retrieves Knowledge Base token.
   */
  getToken: () => localStorage.getItem(KB_TOKEN),

  /**
   * Checks expiry date on JWT token and compares with current time.
   */
  isExpired: () => {
    const token = localStorage.getItem(KB_TOKEN);
    return !!(
      token
      && jwt.decode(token)
      && !Number.isNaN(jwt.decode(token).exp)
      && (jwt.decode(token).exp * 1000) < (new Date()).getTime()
    );
  },

  /**
   * Loads new Knowledge Base token into localstorage.
   * @param {string} token - New Knowledge Base token.
   */
  loadToken: (token) => {
    localStorage.setItem(KB_TOKEN, token);
  },

  /**
   * Clears Knowledge Base token from localstorage.
   */
  clearToken: () => {
    localStorage.removeItem(KB_TOKEN);
    localStorage.removeItem(KEYCLOAK_TOKEN);
  },

  /**
   * Returns username of currently logged in user.
   */
  getUser: () => {
    const token = localStorage.getItem(KB_TOKEN);
    if (token && jwt.decode(token)) {
      return jwt.decode(token).user;
    }
    return null;
  },

  /**
   * Returns true if user is in the 'admin' usergroup.
   */
  isAdmin: () => {
    const token = localStorage.getItem(KB_TOKEN);
    return !!(
      token
      && jwt.decode(token)
      && jwt.decode(token).user
      && jwt.decode(token).user.groups
      && jwt.decode(token).user.groups.find(group => group.name === 'admin')
    );
  },
};
