import { describe, expect, test } from 'vitest';

import { sortAndGroupFields } from '@/components/util';
import schema from '@/services/schema';

describe('util', () => {
  describe('sortAndGroupFields', () => {
    const testModel = {
      properties: {
        name: { name: 'name', mandatory: true },
        address: { name: 'address' },
        gender: { name: 'gender', default: null, mandatory: true },
        comment: schema.get('V').properties.comment,
      },
    };

    test('no order or collapse', () => {
      const grouping = sortAndGroupFields(testModel.properties);
      expect(grouping).toEqual({
        fields: ['name', 'address', 'comment', 'gender'],
        extraFields: [],
      });
    });

    test('collapse flag given', () => {
      const grouping = sortAndGroupFields(testModel.properties, { collapseExtra: true });
      expect(grouping).toEqual({
        fields: ['name', 'address', 'gender'],
        extraFields: ['comment'],
      });
    });

    test('co-require name and address', () => {
      const grouping = sortAndGroupFields(testModel.properties, {
        collapseExtra: true,
        groups: [['name', 'address']],
      });
      expect(grouping).toEqual({
        fields: [['name', 'address'], 'gender'],
        extraFields: ['comment'],
      });
    });

    test('promote field above the fold', () => {
      const grouping = sortAndGroupFields(testModel.properties, {
        collapseExtra: true,
      });
      expect(grouping).toEqual({
        fields: ['name', 'address', 'gender'],
        extraFields: ['comment'],
      });
    });
  });
});
