import { describe, expect, test } from 'vitest';

import { decodeJSON, encodeJSON } from './util';

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
