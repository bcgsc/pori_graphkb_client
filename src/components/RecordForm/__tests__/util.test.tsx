import { describe, expect, test } from 'vitest';

import { sortAndGroupFields } from '@/components/util';

describe('util', () => {
  describe('sortAndGroupFields', () => {
    const testModel = {
      properties: {
        name: { name: 'name', mandatory: true },
        address: { name: 'address' },
        gender: { name: 'gender', default: null, mandatory: true },
      },
    };

    test('no order or collapse', () => {
      const grouping = sortAndGroupFields(testModel.properties);
      expect(grouping).toEqual({
        fields: ['gender', 'name', 'address'],
        extraFields: [],
      });
    });

    test('collapse flag given', () => {
      const grouping = sortAndGroupFields(testModel.properties, { collapseExtra: true });
      expect(grouping).toEqual({
        fields: ['name'],
        extraFields: ['gender', 'address'],
      });
    });

    test('co-require name and address', () => {
      const grouping = sortAndGroupFields(testModel.properties, {
        collapseExtra: true,
        groups: [['name', 'address']],
      });
      expect(grouping).toEqual({
        fields: [['name', 'address']],
        extraFields: ['gender'],
      });
    });

    test('promote field above the fold', () => {
      const grouping = sortAndGroupFields(testModel.properties, {
        collapseExtra: true,
        aboveFold: ['address'],
      });
      expect(grouping).toEqual({
        fields: ['name', 'address'],
        extraFields: ['gender'],
      });
    });
  });
});
