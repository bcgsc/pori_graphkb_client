import React from 'react';
import { mount } from 'enzyme';
import GraphExpansionDialog from '../GraphComponent/GraphExpansionDialog/GraphExpansionDialog';
import Schema from '../../services/schema';

const testSchema = new Schema({
  V: {
    name: 'V',
    properties: [],
  },
  Ontology: {
    name: 'Ontology',
    subclasses: [{ name: 'Disease' }],
  },
  Variant: {
    name: 'Variant',
    subclasses: [],
  },
  Disease: {
    name: 'Disease',
    inherits: ['Ontology'],
    properties: [
      { name: 'name', type: 'string', mandatory: true },
      { name: 'sourceId', type: 'string' },
      { name: 'biotype', type: 'string' },
      { name: 'value', type: 'number' },
      { name: 'subsets', type: 'embeddedset' },
      { name: 'linkprop', type: 'link', mandatory: true },
    ],
  },
  edge: {
    name: 'edge',
    inherits: ['E'],
    isEdge: true,
  },
  E: {
    name: 'E',
    subclasses: [{ name: 'edge' }],
  },
});

const testNode = {
  '@rid': '1',
  sourceId: 'hi',
  source: {},
  in_edge: [{
    '@class': 'edge',
    in: { '@rid': '1', source: {} },
    out: { '@rid': '2', source: {} },
  }],
  out_edge: [{
    '@class': 'edge',
    in: { '@rid': '1', source: {} },
    out: { '@rid': '1', source: {} },
  }],
};

describe('KB Context provider and consumers', () => {
  it('does not crash', () => {
    mount(
      <GraphExpansionDialog
        schema={testSchema}
        open
        node={testNode}
        onClose={jest.fn()}
        onExpand={jest.fn()}
        onExpandAll={jest.fn()}
        onExpandExclusion={jest.fn()}
        onExpandByClass={jest.fn()}
      />,
    );
  });
});
