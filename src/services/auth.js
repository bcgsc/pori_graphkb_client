/**
 * Handles token storage and authentication.
 * @module /services/auth
 */

import * as jwt from 'jsonwebtoken';
import config from '../static/config';

const { KEYS } = config;
const { KB_TOKEN } = KEYS;

export default {
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

  isAdmin: () => {
    const token = localStorage.getItem(KB_TOKEN);
    if (token && jwt.decode(token)) {
      return !!jwt.decode(token).user.groups.find(group => group.name === 'admin');
    }
    return null;
  },
};
