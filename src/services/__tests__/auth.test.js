import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import auth from '../auth';

const TEST_USER = { name: 'test user', groups: [{ name: 'not admin' }] };
const ADMIN_USER = { name: 'test user', groups: [{ name: 'admin' }] };
const REALLY_LONG_TIME = 1000000000000;
const ENCRYPTION_KEY = 'NotSuperSecret';

describe('auth methods test', () => {
  describe('expired token', () => {
    const EXPIRED_JWT = jwt.sign({ user: TEST_USER }, ENCRYPTION_KEY, { expiresIn: 0 });
    beforeEach(() => {
      auth.setToken(EXPIRED_JWT);
      auth.setAuthToken(EXPIRED_JWT);
    });
    it('retrieved the user', () => {
      expect(auth.getUser()).to.eql(TEST_USER);
    });
    it('is not authenticated', () => {
      expect(auth.isAuthenticated()).to.eq(false);
    });
    it('is not authorized', () => {
      expect(auth.isAuthorized()).to.eq(false);
    });
    it('is not admin', () => {
      expect(auth.isAdmin()).to.eq(false);
    });
  });

  describe('valid token', () => {
    const VALID_JWT = jwt.sign({ user: TEST_USER }, ENCRYPTION_KEY, { expiresIn: REALLY_LONG_TIME });
    beforeEach(() => {
      auth.setToken(VALID_JWT);
      auth.setAuthToken(VALID_JWT);
    });
    it('retrieved the user', () => {
      expect(auth.getUser()).to.eql(TEST_USER);
    });
    it('is authenticated', () => {
      expect(auth.isAuthenticated()).to.eq(true);
    });
    it('is not authorized', () => {
      expect(auth.isAuthenticated()).to.eq(true);
    });
    it('is not admin', () => {
      expect(auth.isAdmin()).to.eq(false);
    });
  });

  describe('valid admin token without auth server', () => {
    const VALID_JWT = jwt.sign({ user: ADMIN_USER }, ENCRYPTION_KEY, { expiresIn: REALLY_LONG_TIME });
    beforeEach(() => {
      auth.setToken(VALID_JWT);
    });
    it('retrieved the user', () => {
      expect(auth.getUser()).to.eql(ADMIN_USER);
    });
    it('is not authenticated', () => {
      expect(auth.isAuthenticated()).to.eq(false);
    });
    it('is authorized', () => {
      expect(auth.isAuthorized()).to.eq(true);
    });
    it('is admin', () => {
      expect(auth.isAdmin()).to.eq(true);
    });
  });

  describe('admin token', () => {
    const VALID_JWT = jwt.sign({ user: ADMIN_USER }, ENCRYPTION_KEY, { expiresIn: REALLY_LONG_TIME });
    beforeEach(() => {
      auth.setToken(VALID_JWT);
      auth.setAuthToken(VALID_JWT);
    });
    it('retrieved the user', () => {
      expect(auth.getUser()).to.eql(ADMIN_USER);
    });
    it('is authenticated', () => {
      expect(auth.isAuthenticated()).to.eq(true);
    });
    it('is not authorized', () => {
      expect(auth.isAuthenticated()).to.eq(true);
    });
    it('is admin', () => {
      expect(auth.isAdmin()).to.eq(true);
    });
  });

  it('setToken & getToken', () => {
    const token = 'pass';
    auth.setToken(token);
    expect(auth.getToken()).to.eq('pass');
  });

  it('clearToken clears token', () => {
    const token = 'pass';
    auth.setToken(token);
    expect(auth.getToken()).to.eq('pass');
    auth.clearTokens();
    expect(auth.getToken()).to.eq(null);
  });

  afterEach(() => {
    auth.clearTokens();
  });
});
