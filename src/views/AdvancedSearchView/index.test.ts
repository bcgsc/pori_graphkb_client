import { describe, expect, test } from 'vitest';

import { encodeJSON } from '@/components/util';

import { loader } from './index';

function loadQuery(queryBody: unknown): ReturnType<typeof loader> {
  const request = new Request(`http://localhost/query-advanced?${new URLSearchParams({
    q: encodeJSON(queryBody),
  })}`);
  return loader({ request } as Parameters<typeof loader>[0]);
}

describe('AdvancedSearchView loader', () => {
  test('retains query options alongside the editable target and filter groups', () => {
    const queryOptions = {
      history: true,
      orderBy: ['createdAt'],
      orderByDirection: 'DESC',
      neighbors: 3,
      limit: 50,
      skip: 10,
      returnProperties: ['@rid', 'name'],
    };
    const result = loadQuery({
      ...queryOptions,
      target: 'Statement',
      filters: { reviewStatus: 'passed' },
    });

    expect(result.query).toEqual({
      ...queryOptions,
      target: 'Statement',
      filters: [[{ reviewStatus: 'passed' }]],
    });
    expect(result.warning).toBeUndefined();
  });

  test('returns a warning for a query target that Advanced Search cannot use', () => {
    const result = loadQuery({ target: ['#111:111'] });

    expect(result.query.target).toBe('Statement');
    expect(result.warning).toMatch(/requires a class name as the query target/i);
  });

  test.each([
    42,
    'BRAF',
    null,
    { AND: null },
    { OR: ['BRAF'] },
    { AND: [{ OR: [42] }] },
    { AND: [], OR: [] },
  ])('warns and resets malformed filters %j', (filters) => {
    const result = loadQuery({ target: 'Therapy', filters });

    expect(result.query).toEqual({ target: 'Statement', filters: [[]] });
    expect(result.warning).toMatch(/query body does not match the \/query API shape/i);
  });

  test('returns a warning for a fixed subquery', () => {
    const result = loadQuery({
      queryType: 'keyword',
      target: 'PositionalVariant',
      keyword: 'BRAF',
    });

    expect(result.query.target).toBe('PositionalVariant');
    expect(result.warning).toMatch(/keyword query type is not supported/i);
  });

  test.each([
    { query: { target: 'Statement', neighbors: 'many' }, filters: [[]] },
    {
      query: { target: 'Statement', filters: { relevance: { queryType: 'keyword' } } },
      filters: [[{ relevance: { queryType: 'keyword' } }]],
    },
  ])('leaves GUI-safe query options and comparison values for API validation %j', ({ query, filters }) => {
    const result = loadQuery(query);

    expect(result.query).toEqual({ ...query, filters });
    expect(result.warning).toBeUndefined();
  });

  test('converts an array of filter groups for display', () => {
    const filters = [{ AND: [{ operator: 'IN', relevance: ['#111:111'] }] }];
    const result = loadQuery({ target: 'Statement', filters });

    expect(result.query.filters).toEqual([[{ operator: 'IN', relevance: ['#111:111'] }]]);
  });

  test('treats an empty OR as no filter groups', () => {
    const result = loadQuery({ target: 'Statement', filters: { OR: [] } });

    expect(result.query.filters).toEqual([[]]);
    expect(result.warning).toBeUndefined();
  });

  test('preserves nested filters for display', () => {
    const nestedFilter = { OR: [{ operator: 'IN', relevance: ['#111:111'] }] };
    const result = loadQuery({ target: 'Statement', filters: { AND: [nestedFilter] } });

    expect(result.query.filters).toEqual([[nestedFilter]]);
    expect(result.warning).toBeUndefined();
  });
});
