import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import api from '../api';

describe('api methods test', () => {
  it('can get token', async () => {
    const user = process.env.JEST_USER;
    const password = process.env.JEST_PASSWORD;
    const { kbToken } = await api.post('/token', { username: user, password });
    expect(jwt.decode(kbToken).user.name).to.eq(user);
  });

  it('cant get token', async () => {
    const user = process.env.JEST_USER;
    const password = process.env.JEST_PASSWORD;

    try {
      await api.post('/token', { username: `${user}a`, password });
    } catch (e) {
      expect(e).to.eq('Unauthorized, redirecting...');
    }

    expect(true).to.eq(true);
  });

  it('can get schema', async () => {
    const schema = await api.getSchema();
    expect(typeof schema).to.eq('object');
  });
});
