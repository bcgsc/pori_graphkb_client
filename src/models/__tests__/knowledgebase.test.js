import { expect } from 'chai';
import classes from '../classes';
import Schema from '../schema';

const { Ontology } = classes;
const mockSchema = new Schema({
  cls1: {
    inherits: ['Ontology'],
  },
  AliasOf: {
    name: 'AliasOf',
    inherits: ['E'],
  },
  SubClassOf: {
    name: 'SubClassOf',
    inherits: ['E'],
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

    testObjs.forEach(testObj => expect(testObj.getPreview()).to.eq('pass'));
  });
});
