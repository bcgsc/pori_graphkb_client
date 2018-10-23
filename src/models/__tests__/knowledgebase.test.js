import { expect } from 'chai';
import { Record, Edge } from '../classes';

describe('ontology methods test', () => {
  beforeAll(() => {
    const edges = ['AliasOf', 'SubClassOf'];
    Record.loadEdges(edges);
  });

  it('Edge getId', () => {
    const data = {
      '@rid': 'pass',
      '#rid': 'fail',
      in: {
        '@rid': 'fail',
      },
    };
    const o = new Edge(data);

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
    const o = new Record(data);

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
    const o = new Record(data);
    expect(o.getEdges()).to.have.length(2);
    expect(o.getEdgeTypes()).to.have.length(2);
  });
});
