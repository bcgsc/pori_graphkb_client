import jwt from 'jsonwebtoken';

import api from '../api';


describe('api methods test', () => {
  it('can get token', async () => {
    const username = process.env.USER;
    const password = process.env.PASSWORD || 'dummy'; // connect to DISABLED AUTH test API server
    const { kbToken } = await api.post('/token', { username, password }).request();
    expect(jwt.decode(kbToken).user.name).toBe(username);
  });

  it('bad username', async () => {
    const username = 'dummy';
    const password = process.env.PASSWORD || 'dummy';

    try {
      await api.post('/token', { username, password }).request();
    } catch (e) {
      expect(e.message).toBe('Unauthorized');
    }
  });
});
