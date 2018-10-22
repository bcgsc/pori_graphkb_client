import { expect } from 'chai';
import auth from '../auth';

// Payload:
//   exp: 0,
//   payload: "helo",
//   user: {
//      name: "test user",
//      groups: [
//        { name: "not admin" }
//      ]
//   }
const FAKE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjAsInBheWxvYWQiOiJoZWxvIiwidXNlciI6eyJuYW1lIjoidGVzdCB1c2VyIiwiZ3JvdXBzIjpbeyJuYW1lIjoibm90IGFkbWluIn1dfX0.hxrVtALihqyaT4SDDQZCMmpE33uFkHnaQz1ZCCQntyo';

describe('auth methods test', () => {
  it('loadToken & getToken', () => {
    const token = 'pass';
    auth.loadToken(token);
    expect(auth.getToken()).to.eq('pass');
  });

  it('detects expired token', () => {
    auth.loadToken(FAKE_JWT);
    expect(auth.isExpired()).to.eq(true);
  });

  it('clearToken clears token', () => {
    const token = 'pass';
    auth.loadToken(token);
    expect(auth.getToken()).to.eq('pass');
    auth.clearToken();
    expect(auth.getToken()).to.eq(null);
  });

  it('getUser gets user', () => {
    auth.loadToken(FAKE_JWT);
    expect(auth.getUser()).to.eq('test user');
  });

  it('detects if user is admin', () => {
    expect(auth.isAdmin()).to.eq(false);
  });
});
