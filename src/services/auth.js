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
  DISABLE_AUTH,
} = config;

const KEYCLOAK_REFERRER = 'KEYCLOAK_LOGIN_REFERRER';


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
    this.disableAuth = disableAuth;
    this.referrerUriKey = referrerUriKey;
  }


  /**
 * Returns the keycloak token.
 */
  getAuthToken() {
    return localStorage.getItem(KEYCLOAK_TOKEN);
  }

  /**
 * Loads KeyCloak token into localstorage.
 */
  setAuthToken(token) {
    localStorage.setItem(KEYCLOAK_TOKEN, token);
  }

  /**
 * Retrieves Knowledge Base token.
 */
  get authorizationToken() {
    return localStorage.getItem(KB_TOKEN);
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
  * User has a valid token from the authentication server (keycloak)
  */
  isAuthenticated() {
    const token = this.getAuthToken();
    return !!(validToken(token) && !isExpired(token));
  }

  /**
 * User has a valid token from the database server
 */
  isAuthorized() {
    const token = this.getToken();
    return !!(validToken(token) && !isExpired(token));
  }

  /**
 * Loads new Knowledge Base token into localstorage.
 * @param {string} token - New Knowledge Base token.
 */
  set authorizationToken(token) {
    localStorage.setItem(KB_TOKEN, token);
  }

  /**
 * Clears Knowledge Base token from localstorage.
 */
  clearTokens() {
    localStorage.removeItem(KB_TOKEN);
    localStorage.removeItem(KEYCLOAK_TOKEN);
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
 * Returns true if user is in the 'admin' usergroup.
 */
  isAdmin() {
    try {
      return Boolean(
        this.isAuthorized()
      && jwt.decode(this.getToken()).user.groups.find(group => group.name === 'admin'),
      );
    } catch (err) {
      return false;
    }
  }

  hasWriteAccess() {
    try {
      return Boolean(
        this.isAuthorized()
        && jwt.decode(this.getToken()).user.groups.find(
          group => ['admin', 'regular'].includes(group.name),
        ),
      );
    } catch (err) {
      return false;
    }
  }

  /**
 * Redirects to keycloak login page, sets token into localstorage once returned.
 */
  async login(referrerUri = null) {
    this.clearTokens();
    localStorage.setItem(KEYCLOAK_REFERRER, referrerUri);
    await this.keycloak.init({ onLoad: 'login-required', promiseType: 'native' });
    this.setAuthToken(this.keycloak.token);
    return this.keycloak.token;
  }

  /**
 * Clears tokens and redirects user to keycloak login page. On successful login
 * routes to /login.
 */
  async logout() {
    this.clearTokens();
    try {
      await this.keycloak.init({ promiseType: 'native' });
      const resp = await this.keycloak.logout({ redirectUri: `${window.location.origin}/login` });
      return resp;
    } catch (err) {
      return err;
    }
  }
}


export default {
  Authentication,
  GRAPHKB_ROLE,
};
