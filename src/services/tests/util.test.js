import { expect } from 'chai';
import util from '../util';


const schema = {
  classOne: {
    properties: {
      name: { name: 'name', type: 'string' },
      day: { name: 'day', type: 'integer' },
      hour: { name: 'hour', type: 'string' },
      foo: { name: 'foo', type: 'link' },
      bar: { name: 'bar', type: 'link' },
    },
    inherits: ['classTwo', 'V'],
    route: 'root',
  },
  classTwo: {
    properties: {
      name: 'name',
      day: 'day',
      minute: 'minute',
      second: 'second',
      foo: 'foo',
    },
    route: 'pass',
    inherits: [],
  },
};

describe('util methods test', () => {
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

  it('getPreview', () => {
    const testObjs = [
      {
        sourceId: 'fail',
        name: 'pass',
        blargh: 'fail',
      },
      {
        name: 'pass',
        sourceId: 'fail',
      },
      {
        name: 'pass',
        sourceEyeDee: 'fail',
      },
      {
        source:
        {
          id: 'fail',
        },
        nam:
        {
          name: 'fail',
        },
        blargh: 'pass',
      },
    ];

    testObjs.forEach(testObj => expect(util.getPreview(testObj)).to.eq('Pass'));
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

  it('getEdgeLabel', () => {
    const testEdges = [
      'in_AliasOf',
      'out_AliasOf',
      'out_DeprecatedBy',
      'in_ElementOf',
      'out_SupportedBy',
      'in_SupportedBy',
      'in_Implies',
      'out_Implies',
      'in_hasSubClass',
    ];
    const outputs = [
      'hasAlias',
      'AliasOf',
      'DeprecatedBy',
      'hasElement',
      'SupportedBy',
      'Supports',
      'ImpliedBy',
      'Implies',
      'hasSubClass',
    ];
    testEdges.forEach((edge, i) => {
      expect(util.getEdgeLabel(edge)).to.eq(outputs[i]);
    });
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
          failfail: 'fail',
          name: 'pass',
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
      list.forEach((listItem, i) => {
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
      { name: 'class' },
    ];
    const testPayloads = [
      {
        name: 'name',
        blargh: 'blargh',
        source: '',
        filteredOut: '',
      },
      {
        'name.@rid': 'name',
        name: 'fail',
        's.@rid': 'fail',
      },
    ];
    const output = [
      {
        name: 'name',
        blargh: 'blargh',
      },
      {
        name: 'name',
      },
    ];

    testPayloads.forEach((payload, i) => {
      const filtered = util.parsePayload(payload, testProps);
      Object.keys(filtered).forEach((key) => {
        expect(filtered[key]).to.eq(output[i][key]);
      });
    });
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

  it('initModel', () => {
    const testClass = [
      { name: 'name', type: 'string' },
      { name: 'source', type: 'embeddedset' },
      { name: 'alias', type: 'link' },
      { name: 'num', type: 'integer' },
    ];

    const testModel = {
      name: 'hello',
    };
    const result = util.initModel(testModel, testClass);
    expect(Object.keys(result).length).to.eq(7);
    expect(result.name).to.eq('hello');
    expect(Array.isArray(result.source));
    expect(result.source.length).to.eq(0);
  });

  it('getClass', () => {
    expect(util.getClass('classOne', schema).properties.length).to.eq(5);
    schema.V = {
      properties: {
        day: 'day',
        minute: 'minute',
        second: 'second',
        bar: 'bar',
      },
      inherits: [],
    };
    expect(util.getClass('classOne', schema).properties.length).to.eq(3);
    expect(util.getClass('classTwo', schema).properties.length).to.eq(2);
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

  it('isAbstract, getSubClasses', () => {
    expect(util.isAbstract('classTwo', schema));
    expect(!util.isAbstract('classOne', schema));
    expect(util.getSubClasses('classTwo', schema).length).to.eq(1);
  });

  it('getPropOfType', () => {
    const classOne = util.getClass('classOne', schema).properties;
    expect(util.getPropOfType(classOne, 'string').length).to.eq(2);
    expect(util.getPropOfType(classOne, 'link').length).to.eq(1);
    expect(util.getPropOfType(classOne, 'nothing').length).to.eq(0);
  });
});
