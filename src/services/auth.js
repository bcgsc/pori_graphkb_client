import * as jwt from 'jsonwebtoken';
import config from '../config.json';

const { KEYS } = config;
const { KB_TOKEN } = KEYS;

/**
 * Handles token storage and authentication.
 */
export default class auth {
  /**
   * Retrieves Knowledge Base token.
   */
  static getToken() {
    return localStorage.getItem(KB_TOKEN);
  }

  /**
   * Checks expiry date on JWT token and compares with current time.
   */
  static isExpired() {
    const token = localStorage.getItem(KB_TOKEN);
    if (token && jwt.decode(token)) {
      const expiry = jwt.decode(token).exp;
      const now = new Date();
      return now.getTime() > expiry * 1000;
    }
    return false;
  }

  /**
   * Loads new Knowledge Base token into localstorage.
   * @param {string} token - New Knowledge Base token.
   */
  static loadToken(token) {
    localStorage.setItem(KB_TOKEN, token);
  }

  /**
   * Clears Knowledge Base token from localstorage.
   */
  static clearToken() {
    localStorage.removeItem(KB_TOKEN);
  }

  /**
   * Returns username of currently logged in user.
   */
  static getUser() {
    const token = localStorage.getItem(KB_TOKEN);
    if (token && jwt.decode(token)) {
      return jwt.decode(token).user.name;
    }
    return null;
  }
}
