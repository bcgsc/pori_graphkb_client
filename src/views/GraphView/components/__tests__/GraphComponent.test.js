import '@testing-library/jest-dom/extend-expect';

import {
  act,
  fireEvent,
  render,
} from '@testing-library/react';
import React from 'react';

import GraphComponent from '../GraphComponent/GraphComponent';

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
});

describe('<GraphComponent />', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let dom;
  const handleDetailDrawerOpen = jest.fn();
  const handleDetailDrawerClose = jest.fn();


  beforeEach(() => {
    dom = render(
      <GraphComponent
        cache={cacheSpy}
        data={[...mockData]}
        edgeTypes={['out_AliasOf', 'in_AliasOf']}
        handleDetailDrawerClose={handleDetailDrawerClose}
        handleDetailDrawerOpen={handleDetailDrawerOpen}
        handleError={handleErrSpy}
        handleNewColumns={() => { }}
      />,
    );
  });


  test('renders all nodes specified in displayed', async () => {
    const { container } = dom;

    expect(container.querySelectorAll('svg circle.node')).toHaveLength(4);
    expect(container.querySelectorAll('svg path.link')).toHaveLength(1);
  });


  test('methods don\'t crash component', async () => {
    const { container } = dom;

    const optionBtn = container.querySelector('div.toolbar button#graph-options-btn');
    fireEvent.click(optionBtn);

    const refreshBtn = container.querySelector('div.toolbar .refresh-wrapper button');
    fireEvent.click(refreshBtn);
  });

  test('clicking nodes and links calls appropriate handlers', async () => {
    const { container } = dom;
    const graphNode = container.querySelector('circle.node');
    await act(() => fireEvent.click(graphNode));
    const graphLink = container.querySelector('path.link');
    await act(() => fireEvent.click(graphLink));


    fireEvent.click(container.querySelector('#details'));
    fireEvent.click(container.querySelector('div.svg-wrapper svg'));
    await act(() => fireEvent.click(graphNode));

    expect(handleDetailDrawerOpen).toHaveBeenCalledTimes(4);
    expect(handleDetailDrawerClose).toHaveBeenCalledTimes(2);
  });

  test('svg click handling clears detail drawer', async () => {
    const { container } = dom;
    expect(handleDetailDrawerClose).toHaveBeenCalledTimes(1);
    const graphNode = container.querySelector('circle.node');

    await act(() => fireEvent.click(graphNode));
    fireEvent.click(container.querySelector('div.svg-wrapper svg'));
    expect(handleDetailDrawerClose).toHaveBeenCalledTimes(2);
  });
});
