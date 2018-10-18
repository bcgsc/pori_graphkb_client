import { expect } from 'chai';
import { Ontology, OntologyEdge } from '../ontology';

describe('ontology methods test', () => {
  beforeAll(() => {
    const edges = ['AliasOf', 'SubClassOf'];
    Ontology.loadEdges(edges);
  });

  it('OntologyEdge', () => {
    const data = {
      '@rid': 'pass',
      '#rid': 'fail',
      in: {
        '@rid': 'fail',
      },
    };
    const o = new OntologyEdge(data);

    expect(o.getId()).to.eq('pass');
  });

  it('Ontology getId', () => {
    const data = {
      name: 'fail',
      '@rid': 'pass',
      '#rid': 'fail',
      source: {
        name: 'fail',
        '@rid': 'fail',
      },
    };
    const o = new Ontology(data);

    expect(o.getId()).to.eq('pass');
  });

  it('Ontology loadEdges', () => {
    const data = {
      name: 'fail',
      '@rid': 'pass',
      '#rid': 'fail',
      source: {
        name: 'fail',
        '@rid': 'fail',
      },
      in_AliasOf: [{
        '@rid': '#135',
        in: {
          '@rid': 'pass',
        },
        out: {
          '@rid': 'fail',
        },
      }],
      out_SubClassOf: [{
        '@rid': '#5252',
        in: {
          '@rid': 'pass',
        },
        out: {
          '@rid': 'fail',
        },
      }],
    };
    const o = new Ontology(data);
    expect(o.getEdges()).to.have.length(2);
  });
});
