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

  test('getTSVRepresentation', () => {
    const testTSVs = [
      {
        name: 'fail',
        sourceId: 'fail',
        key: 'pass',
      },
      {
        key:
        {
          name: 'pass',
          failfail: 'fail',
          fail: 'fail',
        },
      },
    ];
    testTSVs.forEach((testTSV) => {
      expect(util.getTSVRepresentation(testTSV.key, 'key').toLowerCase()).toBe('pass');
    });

    const arrayTestTSVs = [
      {
        testKey: 'key',
        key: [
          'pass',
          'pass',
          'pass',
        ],
      },
      {
        testKey: 'in_key',
        in_key: [
          { out: { '@rid': 'pass' }, in: 'fail', blargh: 'fail' },
          { out: 'pass', blargh: { out: 'fail', '@rid': 'fail' } },
        ],
      },
      {
        testKey: 'out_key',
        out_key: [
          { out: { '@rid': 'fail' }, in: { '@rid': 'pass' } },
          { out: 'fail', in: 'pass' },
        ],
      },
    ];
    arrayTestTSVs.forEach((testTSV) => {
      const list = testTSV[testTSV.testKey];
      let output = '';
      list.forEach((_, i) => {
        output += 'pass';

        if (i < list.length - 1) {
          output += ', ';
        }
      });
      expect(util.getTSVRepresentation(list, testTSV.testKey).toLowerCase()).toBe(output);
    });

    const nestedTestTSVs = [
      {
        testKey: 'source.key',
        source: {
          key: 'pass',
          fail: 'fail',
          pass: 'fail',
        },
      },
      {
        testKey: 'source.key.key',
        source: {
          key: { key: 'pass' },
          fail: 'fail',
          pass: 'fail',
        },
      },
    ];
    nestedTestTSVs.forEach((testTSV) => {
      expect(util
        .getTSVRepresentation(
          testTSV[testTSV.testKey.split('.')[0]],
          testTSV.testKey,
        ).toLowerCase()).toBe('pass');
    });
  });

  test('parsePayload', () => {
    const testProps = [
      { name: 'name' },
      { name: 'blargh' },
      { name: 'sourceId' },
      { name: 'source' },
      { name: 'link', type: 'link' },
      { name: 'embedded' },
    ];
    const testPayloads = [
      {
        name: 'name',
        blargh: 'blargh',
        source: '',
        filteredOut: '',
      },
      {
        'link.data': {
          '@rid': 'name',
        },
        link: 'fail',
        's.data': {
          '@rid': 'fail',
        },
      },
    ];
    const output = [
      {
        name: 'name',
        blargh: 'blargh',
      },
      {
        link: 'name',
      },
    ];

    const flattenedTest = {
      name: 'test case',
      blargh: null,
      embedded: {
        name: 'nested prop',
        evenMoreNested: {
          xyz: 'abc',
        },
      },
    };
    const flattened = {
      name: 'test case',
      'embedded[name]': 'nested prop',
      'embedded[evenMoreNested][xyz]': 'abc',
    };

    testPayloads.forEach((payload, i) => {
      const filtered = util.parsePayload(payload, testProps);
      expect(filtered).toEqual(output[i]);
    });

    expect(util.parsePayload(flattenedTest, testProps, [], true)).toEqual(flattened);
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

  test('parsePermission', () => {
    const test = [
      { val: 6, result: [0, 1, 1, 0] },
      { val: 8, result: [0, 0, 0, 1] },
      { val: 3, result: [1, 1, 0, 0] },
      { val: 0, result: [0, 0, 0, 0] },
      { val: 5, result: [1, 0, 1, 0] },
    ];

    test.forEach(testCase => expect(util.parsePermission(testCase.val)).toEqual(testCase.result));
  });

  test('getPropOfType', () => {
    const classOne = [
      { name: 'name', type: 'string' },
      { name: 'day', type: 'integer' },
      { name: 'hour', type: 'string' },
      { name: 'foo', type: 'link' },
      { name: 'bar', type: 'link' },
    ];
    expect(util.getPropOfType(classOne, 'string').length).toBe(2);
    expect(util.getPropOfType(classOne, 'link').length).toBe(2);
    expect(util.getPropOfType(classOne, 'nothing').length).toBe(0);
  });
});
