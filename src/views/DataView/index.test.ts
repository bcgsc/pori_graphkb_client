import { describe, expect, test } from 'vitest';

import { encodeJSON } from '@/components/util';
import { NotFoundError } from '@/services/errors';

import { loader } from './index';

function getRedirectUrl(result: ReturnType<typeof loader>, request: Request): URL {
  if (!(result instanceof Response)) {
    throw new Error('Expected the loader to redirect.');
  }
  const location = result.headers.get('Location');

  if (!location) {
    throw new Error('Expected a redirect Location header.');
  }

  return new URL(location, request.url);
}

describe('DataView loader legacy redirects', () => {
  test.each(['class', '@class'])('redirects a legacy %s parameter to q', (legacyClassParam) => {
    const searchParams = new URLSearchParams({ [legacyClassParam]: 'Therapy' });
    const request = new Request(`http://localhost/data/table?${searchParams}`);
    const result = loader({ request } as Parameters<typeof loader>[0]);
    const redirectUrl = getRedirectUrl(result, request);

    expect(redirectUrl.pathname).toBe('/data/table');
    expect(redirectUrl.searchParams.get('q')).toBe(encodeJSON({ target: 'Therapy' }));
    expect(redirectUrl.searchParams.has('class')).toBe(false);
    expect(redirectUrl.searchParams.has('@class')).toBe(false);
  });

  test('redirects a legacy complex query and removes legacy parameters', () => {
    const legacyQuery = encodeJSON({ target: 'Therapy' });
    const searchParams = new URLSearchParams({
      class: 'Therapy',
      complex: encodeURIComponent(legacyQuery),
      keep: 'value',
    });
    const request = new Request(`http://localhost/data/table?${searchParams}`);
    const result = loader({ request } as Parameters<typeof loader>[0]);
    const redirectUrl = getRedirectUrl(result, request);

    expect(redirectUrl.searchParams.get('q')).toBe(legacyQuery);
    expect(redirectUrl.searchParams.get('keep')).toBe('value');
    expect(redirectUrl.searchParams.has('complex')).toBe(false);
    expect(redirectUrl.searchParams.has('class')).toBe(false);
  });

  test('does not redirect legacy parameters when q is already present', () => {
    const query = encodeJSON({ target: 'Therapy' });
    const request = new Request(`http://localhost/data/table?${new URLSearchParams({
      q: query,
      class: 'Statement',
    })}`);
    const result = loader({ request } as Parameters<typeof loader>[0]);

    expect(result).not.toBeInstanceOf(Response);

    if (result instanceof Response) {
      throw new Error('Expected loader data instead of a redirect.');
    }

    expect(result.modelName).toBe('Therapy');
    expect(result.queryBody.target).toBe('Therapy');
  });
});

describe('DataView loader model selection', () => {
  test('rejects an unknown query target before rendering the table', () => {
    const request = new Request(`http://localhost/data/table?${new URLSearchParams({
      q: encodeJSON({ target: 'UnknownModel' }),
    })}`);

    expect(() => loader({ request } as Parameters<typeof loader>[0]))
      .toThrow(new NotFoundError('Failed to find the expected model (UnknownModel)'));
  });

  test.each([
    { target: ['#111:111'] },
    { target: { target: 'Statement', filters: { reviewStatus: 'passed' } } },
  ])('uses the base table model for a non-class target %j', ({ target }) => {
    const request = new Request(`http://localhost/data/table?${new URLSearchParams({
      q: encodeJSON({ target }),
    })}`);
    const result = loader({ request } as Parameters<typeof loader>[0]);

    if (result instanceof Response) {
      throw new Error('Expected loader data instead of a redirect.');
    }
    expect(result.modelName).toBe('V');
    expect(result.queryBody.target).toEqual(target);
  });
});
