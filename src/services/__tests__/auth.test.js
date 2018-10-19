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

  it('expired', () => {
    auth.loadToken(FAKE_JWT);
    /* eslint-disable-next-line */
    expect(auth.isExpired()).to.be.true;
  });

  it('clearToken', () => {
    const token = 'pass';
    auth.loadToken(token);
    expect(auth.getToken()).to.eq('pass');
    auth.clearToken();
    expect(!auth.getToken());
  });

  it('getUser', () => {
    auth.loadToken(FAKE_JWT);
    expect(auth.getUser()).to.eq('test user');
  });

  it('isAdmin', () => {
    expect(!auth.isAdmin());
  });
});
