import { expect } from 'chai';
import history from '../history';
import auth from '../auth';

const FAKE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjAsInBheWxvYWQiOiJoZWxvIiwidXNlciI6eyJuYW1lIjoidGVzdCB1c2VyIiwiZ3JvdXBzIjpbeyJuYW1lIjoibm90IGFkbWluIn1dfX0.hxrVtALihqyaT4SDDQZCMmpE33uFkHnaQz1ZCCQntyo';

describe('history methods test', () => {
  it('redirects state to login', () => {
    history.push('/state');
    setTimeout(() => expect(history.prevState).to.eq('/login'), 0);
    history.back();
    setTimeout(() => expect(history.prevState).to.eq('/login'), 0);

    history.prevState = '';
    history.back();
    setTimeout(() => expect(history.prevState).to.eq('/login'), 0);

    auth.loadToken(FAKE_JWT);
    history.push('/state');
    setTimeout(() => expect(history.location.state).to.deep.eq({ timedout: true }));
  });
});
