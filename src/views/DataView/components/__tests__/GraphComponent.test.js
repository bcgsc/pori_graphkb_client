import React from 'react';
import { mount } from 'enzyme';
import GraphComponent from '../GraphComponent/GraphComponent';
import { GraphNode, GraphLink } from '../GraphComponent/kbgraph';

const mockData = {
  '#1': {
    '@rid': '#1',
    name: 'test one',
    sourceId: 'test-1',
    out_AliasOf: [{
      '@rid': '#76',
      in: {
        '@rid': '#1',
      },
      out: {
        '@rid': '#4',
      },
    }],
  },
  '#2': {
    '@rid': '#2',
    name: 'test two',
    sourceId: 'test-2',
    source: {
      name: 'test source',
    },
  },
  '#3': {
    '@rid': '#3',
    name: 'test three',
    sourceId: 'test-3',
  },
  '#4': {
    '@rid': '#4',
    name: 'linked',
    sourceId: 'test-4',
    in_AliasOf: [{
      '@rid': '#76',
      in: {
        '@rid': '#1',
      },
      out: {
        '@rid': '#4',
      },
    }],
  },
};

describe('<GraphComponent />', () => {
  let wrapper;
  const componentDidMountSpy = jest.spyOn(GraphComponent.prototype, 'componentDidMount');

  it('calls componentDidMount on render and doesn\'t crash and burn', () => {
    wrapper = mount(
      <GraphComponent
        data={{}}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
      />,
    );
    expect(componentDidMountSpy).toHaveBeenCalledTimes(1);
  });

  it('renders all nodes specified in displayed', () => {
    wrapper = mount(
      <GraphComponent
        data={mockData}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        displayed={['#1', '#2', '#3']}
        edgeTypes={['AliasOf']}
      />,
    );

    expect(wrapper.find('svg path.link')).toHaveLength(0);
    expect(wrapper.find('svg circle.node')).toHaveLength(3);
  });

  it('renders all nodes and links specified in displayed', () => {
    wrapper = mount(
      <GraphComponent
        data={mockData}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        displayed={['#1', '#2', '#3', '#4']}
        edgeTypes={['AliasOf']}
      />,
    );

    expect(wrapper.find('svg circle.node')).toHaveLength(4);
    expect(wrapper.find('svg path.link')).toHaveLength(1);
  });

  it('methods don\'t crash component', () => {
    wrapper = mount(
      <GraphComponent
        data={mockData}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        handleRefresh={() => { }}
        displayed={['#1', '#2', '#3', '#4']}
        edgeTypes={['AliasOf']}
      />,
    );

    wrapper.find('div.toolbar button.table-btn').simulate('click');
    wrapper.find('div.toolbar button#graph-options-btn').simulate('click');
    wrapper.find('input#linkStrength').simulate('change');
    wrapper.find('div.toolbar .refresh-wrapper button').simulate('click');
  });

  it('clicking nodes and links calls appropriate handlers', () => {
    const handleClick = jest.fn();
    const handleDetailDrawerOpen = jest.fn();
    const actionsNode = new GraphNode({
      x: 0,
      y: 0,
      data: {
        '@rid': '#4',
        name: 'linked',
        sourceId: 'test-4',
        in_AliasOf: [{
          '@rid': '#76',
          in: {
            '@rid': '#1',
          },
          out: {
            '@rid': '#4',
          },
        }],
      },
    });
    const actionsLink = new GraphLink({},
      {
        x: 0,
        y: 0,
        data: {
          '@rid': '#4',
          name: 'linked',
          sourceId: 'test-4',
        },
      },
      {
        x: 0,
        y: 0,
        data: {
          '@rid': '#3',
          name: 'linked',
        },
      });

    wrapper = mount(
      <GraphComponent
        data={mockData}
        handleDetailDrawerOpen={handleDetailDrawerOpen}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        handleClick={handleClick}
        displayed={['#1', '#2', '#3', '#4']}
        edgeTypes={['AliasOf']}
      />,
    );
    wrapper.find('circle.node').first().simulate('click');
    wrapper.find('path.link').first().simulate('click');
    expect(handleClick.mock.calls.length).toBe(1);
    expect(handleDetailDrawerOpen.mock.calls.length).toBe(1);

    wrapper.setState({
      actionsNode,
      actionsNodeIsEdge: false,
    });
    wrapper.find('#expand').simulate('click');
    wrapper.find('#details').simulate('click');
    wrapper.setState({ actionsNode });
    wrapper.find('#hide').simulate('click');
    wrapper.setState({ actionsNode });
    wrapper.find('#close').simulate('click');
    wrapper.setState({
      actionsNode: actionsLink,
      actionsNodeIsEdge: true,
    });
    wrapper.find('#details').simulate('click');
    wrapper.setState({
      actionsNode: actionsLink,
      actionsNodeIsEdge: true,
    });
    wrapper.find('#hide').simulate('click');
  });
  // TODO: Refresh Graph is not working currently
  it.skip('Refreshed graph still remembers displayed nodes', () => {
    wrapper = mount(
      <GraphComponent
        data={mockData}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        handleClick={() => { }}
        displayed={['#1', '#2', '#3', '#4']}
        edgeTypes={['AliasOf']}
      />,
    );
    wrapper = mount(
      <GraphComponent
        data={mockData}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        handleClick={() => { }}
        edgeTypes={['AliasOf']}
      />,
    );
    expect(wrapper.find('circle.node')).toHaveLength(4);
    wrapper.find('circle.node').first().simulate('click');
  });

  it('svg click handling clears actionsNode', () => {
    wrapper = mount(
      <GraphComponent
        data={mockData}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        handleClick={() => { }}
        edgeTypes={['AliasOf']}
        localStorageKey="test"
      />,
    );
    wrapper.find('div.svg-wrapper svg').simulate('click');
    expect(wrapper.state().actionsNode).toBeNull();
  });
});
