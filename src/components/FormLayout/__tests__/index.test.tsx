import '@testing-library/jest-dom/vitest';

import { describe, expect, test } from 'vitest';

import schema from '@/services/schema';

import { sortAndGroupFields } from '..';

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
      const grouping = sortAndGroupFields(testModel);
      expect(grouping).toEqual({
        fields: ['name', 'address', 'comment', 'gender'],
        extraFields: [],
      });
    });

    test('collapse flag given', () => {
      const grouping = sortAndGroupFields(testModel, { collapseExtra: true });
      expect(grouping).toEqual({
        fields: ['name', 'address', 'gender'],
        extraFields: ['comment'],
      });
    });

    test('co-require name and address', () => {
      const grouping = sortAndGroupFields({ ...testModel, fieldOrder: { order: [['name', 'address']] } }, {
        collapseExtra: true,
      });
      expect(grouping).toEqual({
        fields: [['name', 'address'], 'gender'],
        extraFields: ['comment'],
      });
    });

    test('promote field above the fold', () => {
      const grouping = sortAndGroupFields(testModel, {
        collapseExtra: true,
      });
      expect(grouping).toEqual({
        fields: ['name', 'address', 'gender'],
        extraFields: ['comment'],
      });
    });

    test('groups fields listed in the model fieldOrder groups', () => {
      const grouping = sortAndGroupFields({
        properties: {
          name: { name: 'name', mandatory: true },
          address: { name: 'address' },
          city: { name: 'city' },
          country: { name: 'country' },
        },
        fieldOrder: { groups: [['city', 'country']] },
      });
      expect(grouping).toEqual({
        fields: ['name', 'address', ['city', 'country']],
        extraFields: [],
      });
    });

    test('ignores group members which are not on the model', () => {
      const grouping = sortAndGroupFields({
        properties: {
          city: { name: 'city' },
          address: { name: 'address' },
        },
        fieldOrder: { groups: [['city', 'country']] },
      });
      expect(grouping).toEqual({
        fields: ['address', 'city'],
        extraFields: [],
      });
    });

    test('a group is required when any member is required', () => {
      const grouping = sortAndGroupFields({
        properties: {
          a: { name: 'a' },
          b: { name: 'b', mandatory: true },
          c: { name: 'c' },
        },
        fieldOrder: { groups: [['a', 'b']] },
      });
      expect(grouping).toEqual({
        fields: [['a', 'b'], 'c'],
        extraFields: [],
      });
    });

    test('a group stays above the fold when any member is above the fold', () => {
      const properties = {
        address: { name: 'address' },
        comment: schema.get('V').properties.comment,
      };
      expect(sortAndGroupFields({ properties }, { collapseExtra: true })).toEqual({
        fields: ['address'],
        extraFields: ['comment'],
      });
      expect(sortAndGroupFields({ properties, fieldOrder: { groups: [['address', 'comment']] } }, { collapseExtra: true })).toEqual({
        fields: [['address', 'comment']],
        extraFields: [],
      });
    });

    test('groups record metadata fields together in a fixed order below the fold', () => {
      const vProperties = schema.get('V').properties;
      const metadata = ['createdAt', 'createdBy', 'comment'];
      const grouping = sortAndGroupFields({
        properties: {
          name: { name: 'name' },
          ...Object.fromEntries(metadata.map((key) => [key, vProperties[key]])),
        },
      }, { collapseExtra: true });
      expect(grouping).toEqual({
        fields: ['name'],
        extraFields: ['comment', ['createdBy', 'createdAt']],
      });
    });

    test('puts deprecated fields below the fold when collapsing', () => {
      const grouping = sortAndGroupFields({
        properties: {
          name: { name: 'name' },
          old: { name: 'old', deprecated: true },
        },
      }, { collapseExtra: true });
      expect(grouping).toEqual({
        fields: ['name'],
        extraFields: ['old'],
      });
    });

    test('exclude hidden fields', () => {
      const grouping = sortAndGroupFields({
        properties: {
          '@class': { name: '@class', hide: true },
          name: { name: 'name' },
        },
      });
      expect(grouping).toEqual({ fields: ['name'], extraFields: [] });
    });

    test('exclude removes fields including those in order', () => {
      const grouping = sortAndGroupFields({ ...testModel, fieldOrder: { order: [['name', 'address']] } }, {
        exclude: ['address'],
      });
      expect(grouping).toEqual({
        fields: ['name', 'comment', 'gender'],
        extraFields: [],
      });
    });

    test('fieldOrder order puts fields first, accepts single fields and skips unknown ones', () => {
      const grouping = sortAndGroupFields({
        ...testModel,
        fieldOrder: { order: [['missing', 'name'], 'nope', 'gender', ['address', 'missing']] },
      });
      expect(grouping).toEqual({
        fields: ['name', 'gender', 'address', 'comment'],
        extraFields: [],
      });
    });

    test('fieldOrder order keeps groups together in the given order', () => {
      const grouping = sortAndGroupFields({
        ...testModel,
        fieldOrder: { order: [['gender', 'name']] },
      }, { collapseExtra: true });
      expect(grouping).toEqual({
        fields: [['gender', 'name'], 'address'],
        extraFields: ['comment'],
      });
    });
  });
});
