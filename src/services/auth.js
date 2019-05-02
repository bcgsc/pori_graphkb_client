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
    } = opt;
    this.keycloak = Keycloak({
      realm,
      clientId,
      url,
      realm_access: { roles: [role] },
    });
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
  setAuthToken() {
    localStorage.setItem(KEYCLOAK_TOKEN, token);
  }

  /**
 * Retrieves Knowledge Base token.
 */
  getToken() {
    return localStorage.getItem(KB_TOKEN);
  }

  /**
 * Get and remove last refferer
 */
  popReferrerUri() {
    const uri = localStorage.getItem(REFERRER);
    localStorage.removeItem(REFERRER);
    return uri;
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
    const token = getToken();
    return !!(validToken(token) && !isExpired(token));
  }

  /**
 * Loads new Knowledge Base token into localstorage.
 * @param {string} token - New Knowledge Base token.
 */
  setToken(token) {
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
 * Returns username of currently logged in user.
 */
  getUser() {
    try {
      return jwt.decode(this.getToken()).user;
    } catch (err) {
      return null;
    }
  }

  /**
 * Returns true if user is in the 'admin' usergroup.
 */
  isAdmin() {
    try {
      return Boolean(
        isAuthorized()
      && jwt.decode(getToken()).user.groups.find(group => group.name === 'admin'),
      );
    } catch (err) {
      return false;
    }
  }

  hasWriteAccess() {
    try {
      return Boolean(
        isAuthorized()
        && jwt.decode(getToken()).user.groups.find(
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
  async authenticate(referrerUri = null) {
    clearTokens();
    localStorage.setItem(REFERRER, referrerUri);
    await keycloak.init({ onLoad: 'login-required', promiseType: 'native' });
    setAuthToken(keycloak.token);
    return keycloak.token;
  }

  /**
 * Clears tokens and redirects user to keycloak login page. On successful login
 * routes to /login.
 */
  async logout() {
    clearTokens();
    try {
      await keycloak.init({ promiseType: 'native' });
      const resp = await keycloak.logout({ redirectUri: `${window.location.origin}/login` });
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
