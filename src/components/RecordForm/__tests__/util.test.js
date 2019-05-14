import { sortAndGroupFields } from '../util';


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
      const grouping = sortAndGroupFields(testModel);
      expect(grouping).toEqual({
        fields: ['address', 'gender', 'name'],
        extraFields: [],
      });
    });

    test('collapse flag given', () => {
      const grouping = sortAndGroupFields(testModel, { collapseExtra: true });
      expect(grouping).toEqual({
        fields: ['name'],
        extraFields: ['address', 'gender'],
      });
    });

    test('co-require name and address', () => {
      const grouping = sortAndGroupFields(testModel, {
        collapseExtra: true,
        groups: [['name', 'address']],
      });
      expect(grouping).toEqual({
        fields: [['name', 'address']],
        extraFields: ['gender'],
      });
    });

    test('promote field above the fold', () => {
      const grouping = sortAndGroupFields(testModel, {
        collapseExtra: true,
        aboveFold: ['address'],
      });
      expect(grouping).toEqual({
        fields: ['address', 'name'],
        extraFields: ['gender'],
      });
    });
  });
});
