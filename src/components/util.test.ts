import { describe, expect, test } from 'vitest';

import { decodeJSON, encodeJSON, validateQueryBody } from './util';

describe('JSON URL encoding', () => {
  test('round-trips Unicode keys and values', () => {
    const query = {
      target: 'Feature',
      filters: { name: '\u03b2-catenin \u{1f9ec}', '\u540d-\u524d': '\u907a\u4f1d\u5b50' },
    };

    expect(decodeJSON(encodeJSON(query))).toEqual(query);
  });

  test('continues decoding legacy Latin-1 JSON', () => {
    const query = { target: 'Feature', filters: { name: 'caf\u00e9' } };

    expect(decodeJSON(btoa(JSON.stringify(query)))).toEqual(query);
  });
});

describe('validateQueryBody', () => {
  test.each([
    { query: { target: 'Statement' }, expected: true },
    { query: { target: ['#123:123'] }, expected: true },
    { query: { target: 'Statement', neighbors: 'many' }, expected: true },
    { query: { target: 'Statement', filters: { relevance: { queryType: 'keyword' } } }, expected: true },
    { query: { target: { queryType: 'keyword', target: 'Feature' } }, expected: true },
    { query: { target: 'Statement', filters: { operator: 'IN', name: ['BRAF', 'KRAS'] } }, expected: true },
    { query: { target: 'Statement', filters: [{ name: 'BRAF' }, { reviewStatus: 'passed' }] }, expected: true },
    { query: { target: 'Statement', filters: [] }, expected: true },
    { query: { target: 'Statement', filters: { AND: [] } }, expected: true },
    { query: { target: 'Statement', filters: { OR: [] } }, expected: true },
    { query: { target: 'Statement', filters: { AND: [{ name: 'BRAF' }, { OR: [{ reviewStatus: 'passed' }] }] } }, expected: true },
    { query: { target: 'Statement', filters: { name: 'BRAF', AND: undefined, OR: undefined } }, expected: true },
    { query: { target: 'Statement', filters: undefined }, expected: true },
    { query: { target: 'Statement', filters: 'BRAF' }, expected: false },
    { query: { target: 'Statement', filters: 42 }, expected: false },
    { query: { target: 'Statement', filters: null }, expected: false },
    { query: { target: 'Statement', filters: { AND: null } }, expected: false },
    { query: { target: 'Statement', filters: { OR: { name: 'BRAF' } } }, expected: false },
    { query: { target: 'Statement', filters: { AND: [], OR: [] } }, expected: false },
    { query: { target: 'Statement', filters: [{ name: 'BRAF' }, 42] }, expected: false },
    { query: { target: 'Statement', filters: { OR: [{ name: 'BRAF' }, { AND: [null] }] } }, expected: false },
    { query: { target: 'Statement', filters: [[{ name: 'BRAF' }]] }, expected: false },
    { query: null, expected: false },
    { query: [{ target: 'Statement' }], expected: false },
    { query: { filters: { name: 'BRAF' } }, expected: false },
  ])('validates %j', ({ query, expected }) => {
    expect(validateQueryBody(query)).toBe(expected);
  });
});
