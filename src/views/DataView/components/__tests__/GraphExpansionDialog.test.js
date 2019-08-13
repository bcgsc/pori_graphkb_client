import React from 'react';
import { mount } from 'enzyme';
import GraphExpansionDialog from '../GraphComponent/GraphExpansionDialog/GraphExpansionDialog';
import Schema from '../../../../services/schema';

const mockClassModels = {
  V: {
    name: 'V',
    properties: [],
    routeName: '/v',
  },
  Ontology: {
    name: 'Ontology',
    subclasses: [{ name: 'Disease' }],
    routeName: '/ontology',
  },
  Variant: {
    name: 'Variant',
    subclasses: [],
    routeName: '/variant',
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
    routeName: '/disease',
  },
  edge: {
    name: 'edge',
    inherits: ['E'],
    isEdge: true,
    routeName: '/edge',
  },
  E: {
    name: 'E',
    subclasses: [{ name: 'edge' }],
    routeName: '/e',
  },
};
const mockSchemaDef = {
  schema: mockClassModels,
  get: () => ({
    name: 'relationshipName',
    reversename: 'reverseRelationshipName',
  }),
  has: () => {},
  getFromRoute: () => {},
};

const testSchema = new Schema(mockSchemaDef);

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

describe('<GraphExpansionDialog />', () => {
  it('does not crash', () => {
    mount(
      <GraphExpansionDialog
        schema={testSchema}
        open
        node={testNode}
        onClose={jest.fn()}
        onExpand={jest.fn()}
        onStageAll={jest.fn()}
        onStage={jest.fn()}
        onStageClass={jest.fn()}
      />,
    );
  });
});
