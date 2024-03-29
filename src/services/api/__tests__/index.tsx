import api from '..';

describe('api methods test', () => {
  describe('getSearchFromQuery', () => {
    test('complex keyword search', () => {
      const payload = {
        target: 'Disease',
        queryType: 'keyword',
        keyword: 'kras',
      };
      const result = api.getSearchFromQuery({
        modelName: 'disease', routeName: '/query', payload,
      });
      const search = 'class=disease&complex=eyJ0YXJnZXQiOiJEaXNlYXNlIiwicXVlcnlUeXBlIjoia2V5d29yZCIsImtleXdvcmQiOiJrcmFzIn0%3D';
      expect(result).toEqual(search);
    });

    test('keyword search with additional params', () => {
      const payload = {
        keyword: 'kras',
        target: 'Disease',
        queryType: 'keyword',
        limit: 50,
        neighbors: 4,
      };
      const result = api.getSearchFromQuery({
        modelName: 'disease', routeName: '/query', payload,
      });
      expect(result).toEqual(
        'class=disease&complex=eyJrZXl3b3JkIjoia3JhcyIsInRhcmdldCI6IkRpc2Vhc2UiLCJxdWVyeVR5cGUiOiJrZXl3b3JkIiwibGltaXQiOjUwLCJuZWlnaGJvcnMiOjR9',
      );
    });

    test('complex query', () => {
      const payload = {
        target: 'Statement',
        filters: {
          OR: [
            {
              conditions: {
                queryType: 'keyword',
                keyword: 'cancer',
                target: 'Disease',
              },
            },
            {
              conditions: {
                queryType: 'keyword',
                keyword: 'colon',
                target: 'Disease',
              },
            },
          ],
        },
      };
      const result = api.getSearchFromQuery({
        modelName: 'disease', routeName: '/query', payload,
      });
      expect(result).toEqual(
        'class=disease&complex=eyJ0YXJnZXQiOiJTdGF0ZW1lbnQiLCJmaWx0ZXJzIjp7Ik9SIjpbeyJjb25kaXRpb25zIjp7InF1ZXJ5VHlwZSI6ImtleXdvcmQiLCJrZXl3b3JkIjoiY2FuY2VyIiwidGFyZ2V0IjoiRGlzZWFzZSJ9fSx7ImNvbmRpdGlvbnMiOnsicXVlcnlUeXBlIjoia2V5d29yZCIsImtleXdvcmQiOiJjb2xvbiIsInRhcmdldCI6IkRpc2Vhc2UifX1dfX0%3D',
      );
    });
  });

  describe('getQueryFromSearch', () => {
    test('search', () => {
      const payload = {
        target: 'Disease',
        filters: {
          OR: [
            {
              name: 'kras',
              operator: 'CONTAINSTEXT',
            },
          ],
        },
        limit: 50,
        neighbors: 2,
      };

      const search = 'class=disease&complex=eyJ0YXJnZXQiOiJEaXNlYXNlIiwiZmlsdGVycyI6eyJPUiI6W3sibmFtZSI6ImtyYXMiLCJvcGVyYXRvciI6IkNPTlRBSU5TVEVYVCJ9XX0sImxpbWl0Ijo1MCwibmVpZ2hib3JzIjoyfQ%3D%3D';
      const actualSearch = api.getQueryFromSearch(search);
      expect(actualSearch).toEqual({
        payload,
        routeName: '/query',
        modelName: 'disease',
      });
    });

    test('general search', () => {
      const search = 'class=disease&complex=eyJxdWVyeVR5cGUiOiJzaW1pbGlhclRvIiwidGFyZ2V0IjoiRmVhdHVyZSIsImZpbHRlcnMiOnsiQU5EIjpbeyJiaW90eXBlIjoiZ2VuZSJ9LHsiT1IiOlt7Im5hbWUiOiJrcmFzIn0seyJzb3VyY2VJZCI6ImtyYXMifV19XX19';
      const result = api.getQueryFromSearch(search);

      const payload = {
        queryType: 'similiarTo',
        target: 'Feature',
        filters: {
          AND: [
            {
              biotype: 'gene',
            },
            {
              OR: [{ name: 'kras' }, { sourceId: 'kras' }],
            },
          ],
        },
        limit: 100,
        neighbors: 2,
      };

      expect(result.payload).toMatchObject(payload);
      expect(result.routeName).toEqual('/query');
    });
  });
});
