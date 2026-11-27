import { expectTypeOf, test } from 'vitest';

import { QueryBody } from '@/components/types';

test('query body types require the fields of each query variant', () => {
  expectTypeOf<{ target: string }>().toMatchTypeOf<QueryBody>();
  expectTypeOf<{ target: string[] }>().toMatchTypeOf<QueryBody>();
  expectTypeOf<{ target: string; queryType: 'keyword'; keyword: string }>().toMatchTypeOf<QueryBody>();
  expectTypeOf<{ target: string; queryType: 'displayName'; keyword: string }>().toMatchTypeOf<QueryBody>();
  expectTypeOf<{
    queryType: 'similarTo';
    target: { queryType: 'ancestors'; target: string; filters: { name: string } };
  }>().toMatchTypeOf<QueryBody>();
  expectTypeOf<{
    queryType: 'neighborhood';
    target: string;
    filters: { name: string };
  }>().toMatchTypeOf<QueryBody>();

  expectTypeOf<Record<string, never>>().not.toMatchTypeOf<QueryBody>();
  expectTypeOf<{ queryType: 'keyword'; target: string }>().not.toMatchTypeOf<QueryBody>();
  expectTypeOf<{ queryType: 'displayName'; target: string[]; keyword: string }>().not.toMatchTypeOf<QueryBody>();
  expectTypeOf<{ queryType: 'neighborhood'; target: string }>().not.toMatchTypeOf<QueryBody>();
  expectTypeOf<{ queryType: 'unknown'; target: string }>().not.toMatchTypeOf<QueryBody>();
});
