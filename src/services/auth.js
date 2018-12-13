/**
 * Handles token storage and authentication.
 * @module /services/auth
 */
import Keycloak from 'keycloak-js';
import * as jwt from 'jsonwebtoken';
import config from '../static/config';

const { KEYS } = config;
const { KB_TOKEN } = KEYS;

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
    return keycloak.token;
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
      return jwt.decode(token).user;
    }
    return null;
  },

  /**
   * Returns true if user is in the 'admin' usergroup.
   */
  isAdmin: () => {
    const token = localStorage.getItem(KB_TOKEN);
    if (token && jwt.decode(token)) {
      return !!jwt.decode(token).user.groups.find(group => group.name === 'admin');
    }
    return null;
  },
};
