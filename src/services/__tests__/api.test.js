import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import api from '../api';
import auth from '../auth';

describe('api methods test', () => {
  it('calls don\'t fail', async () => {
    const user = process.env.JEST_USER;
    const password = process.env.JEST_PASSWORD;
    const { kbToken } = await api.post('/token', { username: user, password });
    expect(jwt.decode(kbToken).user.name).to.eq(user);
    auth.loadToken(kbToken);
    try {
      await api.post('/token', { username: `${user}a`, password });
      expect(false).to.eq(true);
    } catch (e) {
      expect(true).to.eq(true);
    }
  });
});
