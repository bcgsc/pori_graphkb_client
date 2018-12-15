import { expect } from 'chai';
import util from '../util';

describe('validate outputs for util methods', () => {
  it('antiCamelCase', () => {
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
      expect(output).to.eq(outputs[i]);
    });
  });

  it('expandEdges', () => {
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

    util.expandEdges(testEdges).forEach((edge, i) => expect(edge).to.eq(expectedEdges[i]));
  });

  it('getTSVRepresentation', () => {
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
      expect(util.getTSVRepresentation(testTSV.key, 'key').toLowerCase()).to.eq('pass');
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
      expect(util.getTSVRepresentation(list, testTSV.testKey).toLowerCase()).to.eq(output);
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
        ).toLowerCase())
        .to.eq('pass');
    });
  });

  it('parsePayload', () => {
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
      expect(filtered).to.deep.equal(output[i]);
    });

    expect(util.parsePayload(flattenedTest, testProps, [], true)).to.eql(flattened);
  });

  it('getPallette', () => {
    const testCases = [
      { n: 3, type: 'links' },
      { n: 5, type: 'nodes' },
      { n: -2, type: 'links' },
      { n: 35, type: 'nodes' },
    ];

    testCases.forEach((c) => {
      expect(Array.isArray(util.getPallette(c.n, c.type)));
    });
  });

  it('parsePermission', () => {
    const test = [
      { val: 6, result: [0, 1, 1, 0] },
      { val: 8, result: [0, 0, 0, 1] },
      { val: 3, result: [1, 1, 0, 0] },
      { val: 0, result: [0, 0, 0, 0] },
      { val: 5, result: [1, 0, 1, 0] },
    ];

    test.forEach(testCase => expect(util.parsePermission(testCase.val)).to.eql(testCase.result));
  });

  it('getPropOfType', () => {
    const classOne = [
      { name: 'name', type: 'string' },
      { name: 'day', type: 'integer' },
      { name: 'hour', type: 'string' },
      { name: 'foo', type: 'link' },
      { name: 'bar', type: 'link' },
    ];
    expect(util.getPropOfType(classOne, 'string').length).to.eq(2);
    expect(util.getPropOfType(classOne, 'link').length).to.eq(2);
    expect(util.getPropOfType(classOne, 'nothing').length).to.eq(0);
  });
});
