import { describe, expect, test } from 'vitest';

import { Comparison } from '@/components/types';

import { getComparisonLabelAndIcon } from '.';

describe('getComparisonLabelAndIcon', () => {
  test.each<{
    name: string;
    filter: Comparison;
    labels?: Record<string, string>;
    label: string;
  }>([
    {
      name: 'string property with equals',
      filter: { name: 'BRAF' },
      label: "name = 'BRAF'",
    },
    {
      name: 'string property with contains text',
      filter: { operator: 'CONTAINSTEXT', name: 'oncogenic' },
      label: "name CONTAINSTEXT 'oncogenic'",
    },
    {
      name: 'numeric property with comparison operator',
      filter: { operator: '>=', score: 90 },
      label: 'score >= 90',
    },
    {
      name: 'boolean property',
      filter: { approved: true },
      label: 'approved = true',
    },
    {
      name: 'nullable property',
      filter: { deletedAt: null },
      label: 'deletedAt = null',
    },
    {
      name: 'iterable property containing one value',
      filter: { operator: 'CONTAINS', status: 'active' },
      label: "status CONTAINS 'active'",
    },
    {
      name: 'iterable property containing any value',
      filter: { operator: 'CONTAINSANY', status: ['active', 'pending'] },
      label: "status CONTAINSANY ('active', 'pending')",
    },
    {
      name: 'iterable property containing all values',
      filter: { operator: 'CONTAINSALL', status: ['active', 'approved'] },
      label: "status CONTAINSALL ('active', 'approved')",
    },
    {
      name: 'linked property with one record',
      filter: { gene: '#12:34' },
      labels: { '#12:34': 'BRAF (#12:34)' },
      label: "gene = 'BRAF (#12:34)'",
    },
    {
      name: 'linked property with multiple records',
      filter: { operator: 'IN', gene: ['#12:34', '#56:78'] },
      labels: { '#12:34': 'BRAF (#12:34)' },
      label: "gene IN ('BRAF (#12:34)', '#56:78')",
    },
    {
      name: 'date property',
      filter: { createdAt: '2024-01-15T12:34:56Z' },
      label: "createdAt = '2024-01-15T12:34'",
    },
    {
      name: 'invalid date property',
      filter: { createdAt: 'hello world' },
      label: "createdAt = 'hello world'",
    },
    {
      name: 'keyword similarity subquery',
      filter: {
        operator: 'IN',
        name: {
          queryType: 'similarTo',
          target: {
            queryType: 'keyword',
            keyword: 'lung cancer',
            target: 'Disease',
            operator: '=',
          },
        },
      },
      label: "name = 'lung cancer'",
    },
    {
      name: 'text similarity subquery',
      filter: {
        operator: 'IN',
        name: {
          queryType: 'similarTo',
          target: {
            queryType: 'keyword',
            keyword: 'lung cancer',
            target: 'Disease',
            operator: 'CONTAINSTEXT',
          },
        },
      },
      label: "name CONTAINSTEXT 'lung cancer'",
    },
    {
      name: 'keyword similarity subquery with the default operator',
      filter: {
        operator: 'IN',
        name: {
          queryType: 'similarTo',
          target: {
            queryType: 'keyword',
            keyword: 'lung cancer',
            target: 'Disease',
          },
        },
      },
      label: "name CONTAINSTEXT 'lung cancer'",
    },
    {
      name: 'ancestors tree subquery',
      filter: {
        operator: 'IN',
        evidenceLevel: {
          queryType: 'similarTo',
          target: { queryType: 'ancestors', target: ['#12:34'] },
        },
      },
      labels: { '#12:34': 'Level A (#12:34)' },
      label: "evidenceLevel IN ('Level A (#12:34)')",
    },
    {
      name: 'descendants tree subquery',
      filter: {
        operator: 'IN',
        evidenceLevel: {
          queryType: 'similarTo',
          target: { queryType: 'descendants', target: ['#12:34'] },
        },
      },
      labels: { '#12:34': 'Level A (#12:34)' },
      label: "evidenceLevel IN ('Level A (#12:34)')",
    },

    // malformed / fallback cases
    {
      name: 'malformed filter with multiple attributes',
      filter: { name: 'BRAF', displayName: 'BRAF' },
      label: '{"name":"BRAF","displayName":"BRAF"}',
    },
    {
      name: 'malformed arbitrary object value',
      filter: { evidence: { score: 2, valid: true } } as unknown as Comparison,
      label: 'evidence = {"score":2,"valid":true}',
    },
    {
      name: 'unsupported similarity subquery',
      filter: {
        name: {
          queryType: 'similarTo',
          target: {
            queryType: 'displayName',
            keyword: 'BRAF',
            target: 'Gene',
          },
        },
      },
      label: 'name = {"queryType":"similarTo","target":{"queryType":"displayName","keyword":"BRAF","target":"Gene"}}',
    },
  ])('$name', ({ filter, labels = {}, label }) => {
    expect(getComparisonLabelAndIcon(filter, labels).label).toBe(label);
  });
});
