import util from '../util';

describe('validate outputs for util methods', () => {
  test('antiCamelCase', () => {
    const testStrings = [
      'testString',
      'acronymTestId',
      '@atSymbolTest',
      'Unchangedtest',
    ];
    const outputs = [
      'Test String',
      'Acronym Test ID',
      'At Symbol Test',
      'Unchangedtest',
    ];
    testStrings.forEach((test, i) => {
      const output = util.antiCamelCase(test);
      expect(output).toBe(outputs[i]);
    });
  });

  test('expandEdges', () => {
    const testEdges = [
      'one',
      'blargh',
      'subclassof',
    ];
    const expectedEdges = [
      'in_one',
      'out_one',
      'in_blargh',
      'out_blargh',
      'in_subclassof',
      'out_subclassof',
    ];

    util.expandEdges(testEdges).forEach((edge, i) => expect(edge).toBe(expectedEdges[i]));
  });

  test('getPallette', () => {
    const testCases = [
      { n: 3, type: 'links' },
      { n: 5, type: 'nodes' },
      { n: -2, type: 'links' },
      { n: 35, type: 'nodes' },
    ];

    testCases.forEach((c) => {
      expect(Array.isArray(util.getPallette(c.n, c.type))).toBe(true);
    });
  });
});
