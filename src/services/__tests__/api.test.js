import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import api from '../api';

describe('api methods test', () => {
  it('can get token', async () => {
    const user = process.env.USER;
    const password = process.env.PASSWORD;
    const { kbToken } = await api.post('/token', { username: user, password });
    expect(jwt.decode(kbToken).user.name).to.eq(user);
  });

  it('can\'t get token', async () => {
    const user = process.env.USER;
    const password = process.env.PASSWORD;

    try {
      await api.post('/token', { username: `${user}a`, password });
    } catch (e) {
      expect(e).to.eq('Unauthorized, redirecting...');
    }
  });
});
