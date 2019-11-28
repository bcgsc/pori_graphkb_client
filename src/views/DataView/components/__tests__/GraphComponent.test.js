import { mount } from 'enzyme';
import React from 'react';

import GraphComponent from '../GraphComponent/GraphComponent';
import { GraphLink, GraphNode } from '../GraphComponent/kbgraph';

const mockData = [
  {
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
  {
    '@rid': '#2',
    name: 'test two',
    sourceId: 'test-2',
    source: {
      name: 'test source',
    },
  },
  {
    '@rid': '#3',
    name: 'test three',
    sourceId: 'test-3',
  },
  {
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
];

const handleErrSpy = jest.fn();

const getRecordMockFnc = jest.fn()
  .mockResolvedValue(mockData);

const cacheSpy = ({
  getRecord: () => getRecordMockFnc(),
  getRecords: () => getRecordMockFnc(),
});

describe('<GraphComponent />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  let wrapper;
  const componentDidMountSpy = jest.spyOn(GraphComponent.prototype, 'componentDidMount');

  test('calls componentDidMount on render and doesn\'t crash and burn', () => {
    wrapper = mount(
      <GraphComponent
        cache={cacheSpy}
        data={[]}
        handleDetailDrawerClose={() => { }}
        handleDetailDrawerOpen={() => { }}
        handleError={handleErrSpy}
        handleNewColumns={() => { }}
        handleTableRedirect={() => { }}
      />,
    );
    expect(componentDidMountSpy).toHaveBeenCalledTimes(1);
  });

  test('renders all nodes specified in displayed', async () => {
    wrapper = mount(
      <GraphComponent
        cache={cacheSpy}
        data={[mockData[0], mockData[1], mockData[2]]}
        edgeTypes={['AliasOf']}
        handleDetailDrawerClose={() => { }}
        handleDetailDrawerOpen={() => { }}
        handleError={handleErrSpy}
        handleNewColumns={() => { }}
        edgeTypes={['out_AliasOf', 'in_AliasOf']}
      />,
    );
    await wrapper.update();

    expect(wrapper.find('svg circle.node')).toHaveLength(3);
    expect(wrapper.find('svg path.link')).toHaveLength(0);
  });

  test('renders all nodes and links specified in displayed', async () => {
    wrapper = mount(
      <GraphComponent
        cache={cacheSpy}
        data={mockData}
        edgeTypes={['AliasOf']}
        handleDetailDrawerClose={() => { }}
        handleDetailDrawerOpen={() => { }}
        handleError={handleErrSpy}
        handleNewColumns={() => { }}
        edgeTypes={['out_AliasOf', 'in_AliasOf']}
      />,
    );
    await wrapper.update();

    expect(wrapper.find('svg circle.node')).toHaveLength(4);
    expect(wrapper.find('svg path.link')).toHaveLength(1);
  });

  test('methods don\'t crash component', async () => {
    wrapper = mount(
      <GraphComponent
        cache={cacheSpy}
        data={mockData}
        edgeTypes={['AliasOf']}
        handleDetailDrawerClose={() => { }}
        handleDetailDrawerOpen={() => { }}
        handleError={handleErrSpy}
        handleNewColumns={() => { }}
        handleRefresh={() => { }}
        handleTableRedirect={() => { }}
      />,
    );

    await wrapper.update();

    wrapper.find('div.toolbar button#graph-options-btn').simulate('click');
    wrapper.find('div.toolbar .refresh-wrapper button').simulate('click');
  });

  test('clicking nodes and links calls appropriate handlers', async () => {
    const handleClickSpy = jest.spyOn(GraphComponent.prototype, 'handleExpandNode')
      .mockImplementation(() => {});
    const handleDetailDrawerOpen = jest.fn();
    const actionsNode = new GraphNode({
      x: 1,
      y: 2,
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
    },
    1,
    2);
    const actionsLink = new GraphLink({},
      {
        x: 1,
        y: 2,
        data: {
          '@rid': '#4',
          name: 'linked',
          sourceId: 'test-4',
        },
      },
      {
        x: 2,
        y: 3,
        data: {
          '@rid': '#3',
          name: 'linked',
        },
      });


    wrapper = mount(
      <GraphComponent
        cache={cacheSpy}
        data={mockData}
        displayed={['#1', '#2', '#3', '#4']}
        edgeTypes={['out_AliasOf', 'in_AliasOf']}
        handleClick={handleClickSpy}
        handleDetailDrawerClose={() => { }}
        handleDetailDrawerOpen={handleDetailDrawerOpen}
        handleError={handleErrSpy}
        handleNewColumns={() => { }}
        handleTableRedirect={() => { }}
      />,
    );

    await wrapper.update();

    wrapper.find('circle.node').first().simulate('click');
    wrapper.find('path.link').first().simulate('click');
    expect(handleClickSpy.mock.calls.length).toBe(1);
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
    await wrapper.setState({
      actionsNode: actionsLink,
    });
    wrapper.find('#details').simulate('click');
    await wrapper.setState({
      actionsNode: actionsLink,
    });
    wrapper.find('#hide').simulate('click');
  });

  test('svg click handling clears actionsNode', () => {
    wrapper = mount(
      <GraphComponent
        cache={cacheSpy}
        data={[]}
        edgeTypes={['AliasOf']}
        handleClick={() => { }}
        handleDetailDrawerClose={() => { }}
        handleDetailDrawerOpen={() => { }}
        handleError={handleErrSpy}
        handleNewColumns={() => { }}
        handleTableRedirect={() => { }}
        localStorageKey="test"
      />,
    );

    wrapper.find('div.svg-wrapper svg').at(0).simulate('click');
    expect(wrapper.state().actionsNode).toBeNull();
  });
});
