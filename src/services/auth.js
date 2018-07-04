const KB_TOKEN_KEY = 'kbToken';

export default class auth {
  static getToken() {
    return localStorage.getItem(KB_TOKEN_KEY);
  }

  static loadToken(token) {
    localStorage.setItem(KB_TOKEN_KEY, token);
  }

  static clearToken() {
    localStorage.removeItem(KB_TOKEN_KEY);
  }
}
