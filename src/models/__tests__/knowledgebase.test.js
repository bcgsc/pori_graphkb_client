import { expect } from 'chai';
import classes from '../classes';
import Schema from '../schema';

const {
  Ontology,
  Edge,
  Source,
  Statement,
  PositionalVariant,
  Position,
  Variant,
  Publication,
  V,
} = classes;
const mockSchema = new Schema({
  cls1: {
    name: 'cls1',
    inherits: ['Ontology'],
    properties: [{ name: 'name', type: 'string' }],
  },
  AliasOf: {
    name: 'AliasOf',
    inherits: ['E'],
  },
  SubClassOf: {
    name: 'SubClassOf',
    inherits: ['E'],
  },
  var: {
    name: 'var',
    inherits: ['Variant'],
  },
  pos: {
    name: 'pos',
    inherits: ['Position'],
  },
  test: {
    name: 'test',
    properties: [
      { name: 'name', type: 'string', mandatory: true },
      { name: 'subsets', type: 'embeddedset' },
      { name: 'linkprop', type: 'link', mandatory: true },
      { name: 'boolprop', type: 'boolean', mandatory: true },
    ],
  },
});

describe('ontology methods test', () => {
  it('Edge getId', () => {
    const data = {
      '@rid': 'pass',
      '#rid': 'fail',
      in: {
        '@rid': 'fail',
      },
    };
    const o = new classes.Edge(data, mockSchema);

    expect(o.getId()).to.eq('pass');
  });

  it('Record getId', () => {
    const data = {
      name: 'fail',
      '@rid': 'pass',
      '#rid': 'fail',
      source: {
        name: 'fail',
        '@rid': 'fail',
      },
    };
    const o = new classes.Record(data, mockSchema);

    expect(o.getId()).to.eq('pass');
  });

  it('Record loadEdges', () => {
    const data = {
      name: 'fail',
      '@rid': 'pass',
      '#rid': 'fail',
      source: {
        name: 'fail',
        '@rid': 'fail',
      },
      in_AliasOf: [{
        '@class': 'AliasOf',
        '@rid': '#135',
        in: {
          '@rid': 'pass',
        },
        out: {
          '@rid': 'fail',
        },
      }],
      out_SubClassOf: [{
        '@class': 'SubClassOf',
        '@rid': '#5252',
        in: {
          '@rid': 'pass',
        },
        out: {
          '@rid': 'fail',
        },
      }],
    };
    const o = new classes.V(data, mockSchema);
    expect(o.getEdges()).to.have.length(2);
    expect(o.getEdgeTypes()).to.have.length(2);
  });


  it('getPreview', () => {
    const testObjs = [
      new Ontology({
        sourceId: 'fail',
        name: 'pass',
        blargh: 'fail',
      }, mockSchema),
      new Ontology({
        name: 'pass',
        sourceId: 'fail',
      }, mockSchema),
      new Ontology({
        name: 'pass',
        sourceEyeDee: 'fail',
      }, mockSchema),
      new Ontology({
        source:
        {
          id: 'fail',
        },
        nam:
        {
          name: 'fail',
        },
        blargh: 'pass',
      }, mockSchema),
    ];

    testObjs.forEach((testObj, i) => expect(testObj.getPreview()).to.eq(i === 3 ? undefined : 'pass'));
  });

  it('returns correct identifiers', () => {
    const testEdge = new Edge({
      '@rid': 'fail',
      '@class': 'pass',
      source: {
        '@class': 'var',
        name: 'fail',
      },
    }, mockSchema);
    expect(testEdge.getPreview()).to.eq('pass');
    expect(Edge.getIdentifiers()).to.deep.eq(['@class', 'level.sourceId', 'summary', 'source.name']);

    const testSource = new Source({ name: 'pass', anythingElse: 'fail' });
    expect(testSource.getPreview()).to.eq('pass');

    const testStatement = new Statement({ relevance: { name: 'is the answer' }, appliesTo: { name: 'this test' } });
    expect(testStatement.getPreview()).to.eq('is the answer to this test');
    expect(Statement.getIdentifiers()).to.deep.eq(['appliesTo.name', 'relevance.name', 'source.name']);

    const testPositionalVariant = new PositionalVariant({
      type: {
        '@class': 'Vocabulary',
        sourceId: 'deletion',
      },
      reference1: {
        '@class': 'Feature',
        name: 'kras',
      },
      break1Start: {
        '@class': 'GenomicPosition',
        pos: 1,
      },
      untemplatedSeq: 'a',
    }, mockSchema, true);
    expect(testPositionalVariant.getPreview()).to.eq('kras:g.1del');
    expect(Position.getIdentifiers()).to.deep.eq(['@class', 'pos', 'refAA', 'arm', 'majorBand', 'minorBand']);

    const testBadRecord = new Source({ anythingElse: 'pass' });
    expect(testBadRecord.getPreview()).to.eq(undefined);

    const testVariants = new Variant({
      type: {
        '@class': 'Vocabulary',
        sourceId: 'deletion',
      },
      reference1: {
        '@class': 'Feature',
        name: 'kras',
      },
    }, mockSchema);
    expect(testVariants.getPreview()).to.eq('deletion variant on kras');

    const testPublications = new Publication({
      '@class': 'Publication',
      source: {
        name: 'test journal',
      },
      sourceId: '123',
    });
    expect(testPublications.getPreview()).to.eq('test journal: 123');
  });

  it('initializes model correctly', () => {
    const model = mockSchema.initModel({}, 'test');
    expect(model).to.deep.eq({
      '@class': 'test',
      name: '',
      subsets: [],
      linkprop: '',
      'linkprop.data': null,
      boolprop: false,
    });

    const initModel = mockSchema.initModel({ name: 'name', boolprop: true }, 'test');
    expect(initModel).to.deep.eq({
      '@class': 'test',
      name: 'name',
      subsets: [],
      linkprop: '',
      'linkprop.data': null,
      boolprop: true,
    });
  });

  it('returns correct parent constructor', () => {
    expect(mockSchema.getClassConstructor('var')).to.eq(Variant);
    expect(mockSchema.getClassConstructor('cls1')).to.eq(Ontology);
    expect(mockSchema.getClassConstructor('test')).to.eq(V);
    expect(mockSchema.getClassConstructor('PositionalVariant')).to.eq(PositionalVariant);
    expect(mockSchema.getClassConstructor('AliasOf')).to.eq(Edge);
    expect(mockSchema.getClassConstructor('pos')).to.eq(Position);
    expect(mockSchema.newRecord('')).to.eq(null);
    expect(mockSchema.newRecord({ '@class': 'pos' }).constructor.name).to.eq('Position');
    expect(mockSchema.newRecord({ '@class': 'cls1' }).constructor.name).to.eq('Ontology');
    expect(mockSchema.newRecord({ '@class': 'AliasOf' }).constructor.name).to.eq('Edge');
    expect(mockSchema.newRecord({ '@class': 'Variant' }).constructor.name).to.eq('Variant');
  });

  it('collects props', () => {
    const props = mockSchema.collectOntologyProps(
      {
        '@class': 'test',
        name: 'name',
        boolprop: true,
        linkprop: { '@class': 'cls1', name: 'hi' },
      },
      [],
    );
    const expected = ['name', 'boolprop', 'linkprop.name'];
    expect(props.some(prop => !expected.includes(prop))).to.eq(false);
  });

  it('gets variants', () => {
    expect(mockSchema.getVariants().length).to.eq(1);
  });
});
