import jwt from 'jsonwebtoken';
import {
  getUser, getUsername, isAuthenticated, isAuthorized, isAdmin,
} from '../auth';

const TEST_USER = { name: 'test user', groups: [{ name: 'not admin' }] };
const ADMIN_USER = { name: 'admin user', groups: [{ name: 'admin' }] };
const REALLY_LONG_TIME = 1000000000000;
const ENCRYPTION_KEY = 'NotSuperSecret';

describe('auth methods test', () => {
  const EXPIRED_JWT = jwt.sign({ user: ADMIN_USER }, ENCRYPTION_KEY, { expiresIn: 0 });
  const VALID_JWT = jwt.sign({ user: TEST_USER, preferred_username: 'keycloak username' }, ENCRYPTION_KEY, { expiresIn: REALLY_LONG_TIME });
  const ADMIN_JWT = jwt.sign({ user: ADMIN_USER }, ENCRYPTION_KEY, { expiresIn: REALLY_LONG_TIME });

  describe('expired token', () => {
    it('retrieved the user', () => {
      const user = getUser({ authorizationToken: EXPIRED_JWT });
      expect(user).toEqual(ADMIN_USER);
    });
    it('is not authenticated', () => {
      expect(isAuthenticated({ authorizationToken: EXPIRED_JWT, authenticationToken: EXPIRED_JWT })).toBe(false);
    });
    it('is not authorized', () => {
      expect(isAuthorized({ authorizationToken: EXPIRED_JWT, authenticationToken: EXPIRED_JWT })).toBe(false);
    });
  });

  describe('valid token', () => {
    it('retrieved the user', () => {
      const user = getUser({ authorizationToken: VALID_JWT });
      expect(user).toEqual(TEST_USER);
    });
    it('is authenticated', () => {
      expect(isAuthenticated({ authorizationToken: VALID_JWT, authenticationToken: VALID_JWT })).toBe(true);
    });
    it('is authorized', () => {
      expect(isAuthorized({ authorizationToken: VALID_JWT, authenticationToken: VALID_JWT })).toBe(true);
    });
    it('is not admin', () => {
      expect(isAdmin({ authorizationToken: VALID_JWT })).toBe(false);
    });
  });

  describe('getUsername', () => {
    test('get username from authorizationToken', () => {
      const name = getUsername({ authorizationToken: VALID_JWT, authenticationToken: VALID_JWT });
      expect(name).toEqual('test user');
    });
    test('falls back to authenticationToken if not authorizationToken', () => {
      const name = getUsername({ authenticationToken: VALID_JWT });
      expect(name).toEqual('keycloak username');
    });
  });

  describe('admin token', () => {
    it('retrieved the user', () => {
      const user = getUser({ authorizationToken: ADMIN_JWT });
      expect(user).toEqual(ADMIN_USER);
    });
    it('is authenticated', () => {
      expect(isAuthenticated({ authorizationToken: ADMIN_JWT, authenticationToken: ADMIN_JWT })).toBe(true);
    });
    it('is not authorized', () => {
      expect(isAuthenticated({ authorizationToken: ADMIN_JWT, authenticationToken: ADMIN_JWT })).toBe(true);
    });
    it('is admin', () => {
      expect(isAdmin({ authorizationToken: ADMIN_JWT, authenticationToken: ADMIN_JWT })).toBe(true);
    });
  });
});
