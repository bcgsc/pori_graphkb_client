import util from '../../src/services/util';
import config from '../../src/config.json';

const { GRAPH_DEFAULTS } = config;

describe('util methods test', () => {
  it('antiCamelCase', () => {
    const testStrings = ['testString', 'acronymTestId', '@atSymbolTest', 'Unchangedtest'];
    const outputs = ['Test String', 'Acronym Test ID', 'At Symbol Test', 'Unchangedtest'];
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

    testObjs.forEach(testObj => expect(util.getPreview(testObj)).to.eq('pass'));
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
      expect(util.getTSVRepresentation(testTSV.key, 'key')).to.eq('pass');
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
      expect(util.getTSVRepresentation(list, testTSV.testKey)).to.eq(output);
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
      expect(util.getTSVRepresentation(testTSV[testTSV.testKey.split('.')[0]], testTSV.testKey)).to.eq('pass');
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
    const testPallettes = [
      { n: 5, type: 'nodes' },
      { n: 0, type: 'nodes' },
      { n: 6, type: 'links' },
      { n: 10, type: 'links' },
      { n: 11, type: 'links' },
      { n: 18, type: 'nodes' },
      { n: 28, type: 'nodes' },
      { n: 20, type: 'nodes' },
    ];
    const outputs = [
      GRAPH_DEFAULTS.NODE_COLORS_5,
      GRAPH_DEFAULTS.NODE_COLORS_5,
      GRAPH_DEFAULTS.LINK_COLORS_10,
      GRAPH_DEFAULTS.LINK_COLORS_10,
      GRAPH_DEFAULTS.LINK_COLORS_15,
      GRAPH_DEFAULTS.NODE_COLORS_20,
      '',
      GRAPH_DEFAULTS.NODE_COLORS_20,
    ];
    testPallettes.forEach((testPallette, i) => {
      const { n, type } = testPallette;
      if (n <= 20) {
        expect(util.getPallette(n, type)).to.eq(outputs[i]);
      } else {
        expect(util.getPallette(n, type).length).to.eq(n);
      }
    });
  });
});
