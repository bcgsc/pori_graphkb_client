import React from 'react';
import { mount } from 'enzyme';
import GraphComponent from '../GraphComponent/GraphComponent';
import { GraphNode, GraphLink } from '../GraphComponent/kbgraph';
import Schema from '../../../../services/schema';

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

const handleErrSpy = jest.fn()
  .mockImplementation(err => console.log(err));

const requestMock = jest.fn()
  .mockResolvedValueOnce(mockData['#1'])
  .mockResolvedValueOnce(mockData['#2'])
  .mockResolvedValueOnce(mockData['#3'])
  .mockResolvedValueOnce(mockData['#4']);


const recordApiCallMockFnc = {
  request: () => requestMock(),
};


const getRecordMockFnc = jest.fn()
  .mockResolvedValueOnce(mockData['#4']);

const cacheSpy = ({
  recordApiCall: () => recordApiCallMockFnc,
  getRecord: () => getRecordMockFnc(),
});

describe('<GraphComponent />', () => {
  afterEach(() => {
    jest.clearAllMocks();
    requestMock.mockReset();
  });
  let wrapper;
  const componentDidMountSpy = jest.spyOn(GraphComponent.prototype, 'componentDidMount');
  const schema = new Schema();

  it('calls componentDidMount on render and doesn\'t crash and burn', () => {
    wrapper = mount(
      <GraphComponent
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

  it('renders all nodes specified in displayed', () => {
    requestMock
      .mockResolvedValueOnce(mockData['#1'])
      .mockResolvedValueOnce(mockData['#2'])
      .mockResolvedValueOnce(mockData['#3']);

    wrapper = mount(
      <GraphComponent
        handleError={handleErrSpy}
        cache={cacheSpy}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        displayed={['#1', '#2', '#3']}
        edgeTypes={['AliasOf']}
        schema={schema}
      />,
    );
    wrapper.update();

    setTimeout(() => {
      expect(wrapper.find('svg circle.node')).toHaveLength(3);
      expect(wrapper.find('svg path.link')).toHaveLength(0);
    }, 0);
  });

  it('renders all nodes and links specified in displayed', () => {
    requestMock
      .mockResolvedValueOnce(mockData['#1'])
      .mockResolvedValueOnce(mockData['#2'])
      .mockResolvedValueOnce(mockData['#3'])
      .mockResolvedValueOnce(mockData['#4']);
    wrapper = mount(
      <GraphComponent
        handleError={handleErrSpy}
        cache={cacheSpy}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        displayed={['#1', '#2', '#3', '#4']}
        edgeTypes={['AliasOf']}
        schema={schema}
      />,
    );
    wrapper.update();

    setTimeout(() => {
      expect(wrapper.find('svg circle.node')).toHaveLength(4);
      expect(wrapper.find('svg path.link')).toHaveLength(1);
    }, 0);
  });

  it('methods don\'t crash component', () => {
    requestMock
      .mockResolvedValueOnce(mockData['#1'])
      .mockResolvedValueOnce(mockData['#2'])
      .mockResolvedValueOnce(mockData['#3'])
      .mockResolvedValueOnce(mockData['#4']);
    wrapper = mount(
      <GraphComponent
        handleError={handleErrSpy}
        cache={cacheSpy}
        handleDetailDrawerOpen={() => { }}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        handleRefresh={() => { }}
        displayed={['#1', '#2', '#3', '#4']}
        edgeTypes={['AliasOf']}
        schema={schema}
      />,
    );

    setTimeout(() => {
      wrapper.find('div.toolbar button.table-btn').simulate('click');
      wrapper.find('div.toolbar button#graph-options-btn').simulate('click');
      wrapper.find('input#linkStrength').simulate('change');
      wrapper.find('div.toolbar .refresh-wrapper button').simulate('click');
    }, 0);
  });

  it('clicking nodes and links calls appropriate handlers', () => {
    requestMock
      .mockResolvedValueOnce(mockData['#1'])
      .mockResolvedValueOnce(mockData['#2'])
      .mockResolvedValueOnce(mockData['#3'])
      .mockResolvedValueOnce(mockData['#4']);
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
        handleError={handleErrSpy}
        cache={cacheSpy}
        handleDetailDrawerOpen={handleDetailDrawerOpen}
        handleDetailDrawerClose={() => { }}
        handleTableRedirect={() => { }}
        handleNewColumns={() => { }}
        handleClick={handleClick}
        displayed={['#1', '#2', '#3', '#4']}
        edgeTypes={['AliasOf']}
        schema={schema}
      />,
    );

    wrapper.update();

    setTimeout(() => {
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
    }, 0);
  });

  it('Refreshed graph still remembers displayed nodes', () => {
    requestMock
      .mockResolvedValueOnce(mockData['#1'])
      .mockResolvedValueOnce(mockData['#2'])
      .mockResolvedValueOnce(mockData['#3'])
      .mockResolvedValueOnce(mockData['#4']);
    wrapper = mount(
      <GraphComponent
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
    setTimeout(() => {
      expect(wrapper.find('circle.node')).toHaveLength(4);
      wrapper.find('circle.node').first().simulate('click');
    }, 0);
  });

  it('svg click handling clears actionsNode', () => {
    wrapper = mount(
      <GraphComponent
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

    setTimeout(() => {
      wrapper.find('div.svg-wrapper svg').simulate('click');
      expect(wrapper.state().actionsNode).toBeNull();
    }, 0);
  });
});
