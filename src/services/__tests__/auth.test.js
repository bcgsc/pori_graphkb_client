import jwt from 'jsonwebtoken';
import { Authentication } from '../auth';

const TEST_USER = { name: 'test user', groups: [{ name: 'not admin' }] };
const ADMIN_USER = { name: 'test user', groups: [{ name: 'admin' }] };
const REALLY_LONG_TIME = 1000000000000;
const ENCRYPTION_KEY = 'NotSuperSecret';

describe('auth methods test', () => {
  let auth;

  beforeEach(() => {
    auth = new Authentication();
  });

  describe('expired token', () => {
    const EXPIRED_JWT = jwt.sign({ user: TEST_USER }, ENCRYPTION_KEY, { expiresIn: 0 });
    beforeEach(() => {
      auth.keycloak.token = EXPIRED_JWT;
      auth.authorizationToken = EXPIRED_JWT;
    });
    it('retrieved the user', () => {
      expect(auth.user).toEqual(TEST_USER);
    });
    it('is not authenticated', () => {
      expect(auth.isAuthenticated()).toBe(false);
    });
    it('is not authorized', () => {
      expect(auth.isAuthorized()).toBe(false);
    });
    it('is not admin', () => {
      expect(auth.isAdmin(TEST_USER)).toBe(false);
    });
  });

  describe('valid token', () => {
    const VALID_JWT = jwt.sign({ user: TEST_USER }, ENCRYPTION_KEY, { expiresIn: REALLY_LONG_TIME });
    beforeEach(() => {
      auth.keycloak.token = VALID_JWT;
      auth.authorizationToken = VALID_JWT;
    });
    it('retrieved the user', () => {
      expect(auth.user).toEqual(TEST_USER);
    });
    it('is authenticated', () => {
      expect(auth.isAuthenticated()).toBe(true);
    });
    it('is not authorized', () => {
      expect(auth.isAuthenticated()).toBe(true);
    });
    it('is not admin', () => {
      expect(auth.isAdmin(TEST_USER)).toBe(false);
    });
  });

  describe('valid admin token without authent server', () => {
    const VALID_JWT = jwt.sign({ user: ADMIN_USER }, ENCRYPTION_KEY, { expiresIn: REALLY_LONG_TIME });
    beforeEach(() => {
      auth.authorizationToken = VALID_JWT;
    });
    it('retrieved the user', () => {
      expect(auth.user).toEqual(ADMIN_USER);
    });
    it('is not authenticated', () => {
      expect(auth.isAuthenticated()).toBe(false);
    });
    it('is authorized', () => {
      expect(auth.isAuthorized()).toBe(true);
    });
    it('is admin', () => {
      expect(auth.isAdmin(ADMIN_USER)).toBe(true);
    });
  });

  describe('admin token', () => {
    const VALID_JWT = jwt.sign({ user: ADMIN_USER }, ENCRYPTION_KEY, { expiresIn: REALLY_LONG_TIME });
    beforeEach(() => {
      auth.keycloak.token = VALID_JWT;
      auth.authorizationToken = VALID_JWT;
    });
    it('retrieved the user', () => {
      expect(auth.user).toEqual(ADMIN_USER);
    });
    it('is authenticated', () => {
      expect(auth.isAuthenticated()).toBe(true);
    });
    it('is not authorized', () => {
      expect(auth.isAuthenticated()).toBe(true);
    });
    it('is admin', () => {
      expect(auth.isAdmin(ADMIN_USER)).toBe(true);
    });
  });
});
