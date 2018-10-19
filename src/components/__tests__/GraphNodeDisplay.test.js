import React from 'react';
import { expect } from 'chai';
import { mount, shallow } from 'enzyme';
import GraphNodeDisplay from '../GraphNodeDisplay/GraphNodeDisplay';
import { GraphNode } from '../GraphComponent/kbgraph';

const mockData = new GraphNode(
  {
    '@rid': '#1',
    name: 'node',
    source: {
      name: 'node source',
    },
  },
  0,
  0,
);

describe('<GraphNodeDisplay />', () => {
  let wrapper;

  it('structure', () => {
    wrapper = shallow(
      <GraphNodeDisplay
        node={mockData}
      />,
    );
    expect(wrapper.type()).to.equal('g');
    expect(wrapper.children().first().type()).to.equal('text');
  });

  it('with label', () => {
    wrapper = shallow(
      <GraphNodeDisplay
        node={mockData}
        labelKey="name"
      />,
    );
    expect(wrapper.type()).to.equal('g');
    expect(wrapper.children('text').text()).to.equal('node');
  });

  it('detail', () => {
    const detail = { '@rid': '#2' };
    wrapper = shallow(
      <GraphNodeDisplay
        node={mockData}
        labelKey="source.name"
        detail={detail}
        actionsNode={{ data: detail }}
      />,
    );

    expect(wrapper.find('circle.node').props().style.opacity).to.eq(0.6);
  });

  it('invalid node', () => {
    wrapper = shallow(
      <GraphNodeDisplay
        node={null}
        labelKey="source.name"
        detail={mockData}
      />,
    );
    expect(!wrapper.find('circle.node'));
    wrapper.unmount();
  });

  it('applyDrag', () => {
    const applyDrag = jest.fn();
    wrapper = mount(
      <GraphNodeDisplay
        node={mockData}
        labelKey="source.name"
        applyDrag={applyDrag}
      />,
    );
    expect(applyDrag.mock.calls.length).to.eq(0);
    wrapper.find('g').first().simulate('drag');
    wrapper.find('g').first().simulate('dragstart');
  });
});
