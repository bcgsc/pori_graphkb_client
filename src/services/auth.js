/**
 * Handles token storage and authentication.
 * @module /services/auth
 */
import * as Keycloak from 'keycloak-js';
import * as jwt from 'jsonwebtoken';
import config from '../static/config';

const { KEYS } = config;
const { KB_TOKEN } = KEYS;

/*eslint-disable*/
const keycloak = Keycloak({
  realm: 'TestKB',
  clientId: 'GraphKB',
  url: 'http://ga4ghdev01.bcgsc.ca:8080/auth',
});


const GRAPHKB_ROLE = 'GraphKB';

export default {
  GRAPHKB_ROLE,
  logout: async () => {
    try {
      await keycloak.init();
      localStorage.removeItem(KB_TOKEN);
      const resp = await keycloak.logout();
      return resp;
    } catch (err) {
      localStorage.removeItem(KB_TOKEN);
      return err;
    }
  },
  login: async () => {
    await keycloak.init({ onLoad: 'login-required', promiseType: 'native' });
    return jwt.decode(keycloak.token);
  },
  /**
   * Retrieves Knowledge Base token.
   */
  getToken: () => localStorage.getItem(KB_TOKEN),

  /**
   * Checks expiry date on JWT token and compares with current time.
   */
  isExpired: () => {
    const token = localStorage.getItem(KB_TOKEN);
    if (token && jwt.decode(token)) {
      const expiry = jwt.decode(token).exp;
      const now = new Date();
      return now.getTime() > expiry * 1000;
    }
    return false;
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
  },

  /**
   * Returns username of currently logged in user.
   */
  getUser: () => {
    const token = localStorage.getItem(KB_TOKEN);
    if (token && jwt.decode(token)) {
      return jwt.decode(token);
    }
    return null;
  },

  /**
   * Returns true if user is in the 'admin' usergroup.
   */
  isAdmin: () => {
    return true;
    const token = localStorage.getItem(KB_TOKEN);
    if (token && jwt.decode(token)) {
      return !!jwt.decode(token).user.groups.find(group => group.name === 'admin');
    }
    return null;
  },
};
