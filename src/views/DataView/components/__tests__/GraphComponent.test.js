import React from 'react';
import { mount } from 'enzyme';
import GraphComponent from '../GraphComponent/GraphComponent';
import { GraphNode, GraphLink } from '../GraphComponent/kbgraph';
import Schema from '../../../../services/schema';

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
  .mockResolvedValueOnce(mockData['#4']);

const cacheSpy = ({
  getRecord: () => getRecordMockFnc(),
  getRecords: jest.fn(),
});

describe('<GraphComponent />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  let wrapper;
  const componentDidMountSpy = jest.spyOn(GraphComponent.prototype, 'componentDidMount');
  const schema = new Schema();

  it('calls componentDidMount on render and doesn\'t crash and burn', () => {
    wrapper = mount(
      <GraphComponent
        data={[]}
        handleError={handleErrSpy}
        cache={cacheSpy}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        schema={schema}
      />,
    );
    expect(componentDidMountSpy).toHaveBeenCalledTimes(1);
  });

  it('renders all nodes specified in displayed', async () => {
    wrapper = mount(
      <GraphComponent
        data={[mockData[0], mockData[1], mockData[2]]}
        handleError={handleErrSpy}
        cache={cacheSpy}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        edgeTypes={['AliasOf']}
        schema={schema}
      />,
    );
    await wrapper.update();

    expect(wrapper.find('svg circle.node')).toHaveLength(3);
    expect(wrapper.find('svg path.link')).toHaveLength(0);
  });

  it('renders all nodes and links specified in displayed', async () => {
    wrapper = mount(
      <GraphComponent
        data={mockData}
        handleError={handleErrSpy}
        cache={cacheSpy}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        edgeTypes={['AliasOf']}
        schema={schema}
      />,
    );
    await wrapper.update();

    expect(wrapper.find('svg circle.node')).toHaveLength(4);
    expect(wrapper.find('svg path.link')).toHaveLength(1);
  });

  it('methods don\'t crash component', async () => {
    wrapper = mount(
      <GraphComponent
        data={mockData}
        handleError={handleErrSpy}
        cache={cacheSpy}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        handleRefresh={() => { }}
        edgeTypes={['AliasOf']}
        schema={schema}
      />,
    );

    await wrapper.update();

    wrapper.find('div.toolbar button.table-btn').simulate('click');
    wrapper.find('div.toolbar button#graph-options-btn').simulate('click');
    wrapper.find('input#linkStrength').simulate('change');
    wrapper.find('div.toolbar .refresh-wrapper button').simulate('click');
  });

  it('clicking nodes and links calls appropriate handlers', async () => {
    const handleClickSpy = jest.spyOn(GraphComponent.prototype, 'handleExpandNode')
      .mockImplementation(() => {});
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
        handleError={handleErrSpy}
        cache={cacheSpy}
        handleDetailDrawerOpen={handleDetailDrawerOpen}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        handleClick={handleClickSpy}
        displayed={['#1', '#2', '#3', '#4']}
        edgeTypes={['AliasOf']}
        schema={schema}
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

  it('Refreshed graph still remembers displayed nodes', () => {
    wrapper = mount(
      <GraphComponent
        data={mockData}
        handleError={handleErrSpy}
        cache={cacheSpy}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        handleClick={() => { }}
        displayed={['#1', '#2', '#3', '#4']}
        edgeTypes={['AliasOf']}
        schema={schema}
      />,
    );
    wrapper = mount(
      <GraphComponent
        data={[]}
        handleError={handleErrSpy}
        cache={cacheSpy}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        handleClick={() => { }}
        edgeTypes={['AliasOf']}
        schema={schema}
      />,
    );

    expect(wrapper.find('circle.node')).toHaveLength(4);
    wrapper.find('circle.node').first().simulate('click');
  });

  it('svg click handling clears actionsNode', () => {
    wrapper = mount(
      <GraphComponent
        data={[]}
        handleError={handleErrSpy}
        cache={cacheSpy}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        handleClick={() => { }}
        edgeTypes={['AliasOf']}
        localStorageKey="test"
        schema={schema}
      />,
    );

    wrapper.find('div.svg-wrapper svg').simulate('click');
    expect(wrapper.state().actionsNode).toBeNull();
  });
});
