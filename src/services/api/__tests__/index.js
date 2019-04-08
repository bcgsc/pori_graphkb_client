import jwt from 'jsonwebtoken';

import api from '..';


describe('api methods test', () => {
  test('can get token', async () => {
    const username = process.env.USER;
    const password = process.env.PASSWORD || 'dummy'; // connect to DISABLED AUTH test API server
    const { kbToken } = await api.post('/token', { username, password }).request();
    expect(jwt.decode(kbToken).user.name).toBe(username);
  });

  test('bad username', async () => {
    const username = 'dummy';
    const password = process.env.PASSWORD || 'dummy';

    try {
      await api.post('/token', { username, password }).request();
    } catch (e) {
      expect(e.message).toBe('Unauthorized');
    }
  });

  describe('getSearchFromQuery', () => {
    const schema = { getFromRoute: () => ({ name: 'disease' }) };
    test('keyword search', () => {
      const queryParams = {
        keyword: 'kras',
        limit: 50,
        neighbors: 4,
      };
      const result = api.getSearchFromQuery({
        schema, routeName: '/search', queryParams,
      });
      expect(result).toEqual(
        'keyword=kras&limit=50&neighbors=4',
      );
    });
    test('complex search', () => {
      const payload = {
        where: [
          { operator: 'OR', comparisons: [{ attr: 'name', value: 'kras', operator: 'CONTAINSTEXT' }] },
        ],
        limit: 50,
      };
      const result = api.getSearchFromQuery({
        schema, routeName: '/diseases/search', payload,
      });
      const search = `class=disease&complex=${
        encodeURIComponent('eyJ3aGVyZSI6W3sib3BlcmF0b3IiOiJPUiIsImNvbXBhcmlzb25zIjpbeyJhdHRyIjoibmFtZSIsInZhbHVlIjoia3JhcyIsIm9wZXJhdG9yIjoiQ09OVEFJTlNURVhUIn1dfV0sImxpbWl0Ijo1MH0=')
      }`;
      expect(result).toEqual(search);
    });
    test('general search', () => {
      const queryParams = {
        name: 'kras',
        sourceId: 'kras',
        or: 'name,sourceId',
        limit: 50,
        neighbors: 4,
      };
      const result = api.getSearchFromQuery({
        schema, routeName: '/diseases', queryParams,
      });
      expect(result).toEqual(
        `class=disease&limit=50&name=kras&neighbors=4&or=name${
          encodeURIComponent(',')
        }sourceId&sourceId=kras`,
      );
    });
  });
  describe('getQueryFromSearch', () => {
    const schema = { get: () => ({ routeName: '/diseases' }) };
    test('keyword search', () => {
      const search = 'keyword=kras';
      const result = api.getQueryFromSearch({
        search,
        schema,
      });
      expect(result.payload).toBe(null);
      expect(result.routeName).toEqual('/search');
      expect(result.queryParams.keyword).toEqual('kras');
    });
    test('complex search', () => {
      const complex = {
        where: [
          { operator: 'OR', comparisons: [{ attr: 'name', value: 'kras', operator: 'CONTAINSTEXT' }] },
        ],
        limit: 50,
        neighbors: 3, // adds default neighbors
      };
      const search = `class=disease&complex=${
        encodeURIComponent('eyJ3aGVyZSI6W3sib3BlcmF0b3IiOiJPUiIsImNvbXBhcmlzb25zIjpbeyJhdHRyIjoibmFtZSIsInZhbHVlIjoia3JhcyIsIm9wZXJhdG9yIjoiQ09OVEFJTlNURVhUIn1dfV0sImxpbWl0Ijo1MH0=')
      }`;
      const actualSearch = api.getQueryFromSearch({ schema, search });
      expect(actualSearch).toEqual({
        payload: complex,
        routeName: '/diseases/search',
        queryParams: null,
        modelName: 'disease',
      });
    });
    test('general search', () => {
      const search = 'name=kras&sourceId=kras&or=name,sourceId';
      const result = api.getQueryFromSearch({
        search,
        schema,
      });
      expect(result.payload).toBe(null);
      expect(result.routeName).toEqual('/diseases');
      expect(result.queryParams).toEqual({
        name: 'kras',
        sourceId: 'kras',
        or: 'name,sourceId',
        limit: 100,
        neighbors: 3,
      });
    });
  });
});
