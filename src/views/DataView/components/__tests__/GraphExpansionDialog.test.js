import { mount } from 'enzyme';
import React from 'react';

import testSchema from '@/services/schema';

import GraphExpansionDialog from '../GraphComponent/GraphExpansionDialog/GraphExpansionDialog';


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
  test('does not crash', () => {
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
