import '@testing-library/jest-dom/extend-expect';

import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import FilterGroup from '..';


const mockFilterGroups = [
  {
    name: 'empty filter Group',
    key: 0,
    filters: [],

  },
  {
    name: 'single filter',
    key: 1,
    filters: [
      {
        attr: 'fake attr',
        value: 'value',
        operator: '=',
      },
    ],

  },
  {
    name: 'multiple filters',
    key: 2,
    filters: [
      {
        attr: 'fake prop',
        value: 'value to fake prop',
        operator: '=',
      },
      {
        attr: 'another fake prop',
        value: 'mock text',
        operator: 'CONTAINSTEXT',
      },
    ],

  },
  {
    name: 'object valued filter',
    key: 3,
    filters: [
      {
        attr: 'fake prop',
        value: {
          name: 'linked record name',
        },
        operator: '=',
      },
    ],

  },
];

describe('FilterGroup ', () => {
  afterEach(() => jest.clearAllMocks());

  const handleDeleteSpy = jest.fn();

  describe('Filter group with no filters displays correctly', () => {
    let queryByTestId;
    let getByText;

    beforeEach(() => {
      ({
        queryByTestId, getByText,
      } = render(
        <FilterGroup
          filterGroup={mockFilterGroups[0]}
          handleDelete={handleDeleteSpy}
        />,
      ));
    });

    test('empty filter box ', () => {
      expect(getByText('empty filter Group')).toBeInTheDocument();
    });

    test('displays no filter chips', () => {
      expect(queryByTestId('filter-chip0')).toBeNull();
    });
  });

  describe('Filter Group with 1 filter displays correctly', () => {
    let queryByTestId;
    let queryByText;
    let getByTestId;

    beforeEach(() => {
      ({
        queryByTestId, queryByText, getByTestId,
      } = render(
        <FilterGroup
          filterGroup={mockFilterGroups[1]}
          handleDelete={handleDeleteSpy}
        />,
      ));
    });

    test('display filter box', () => {
      expect(queryByText('single filter')).toBeInTheDocument();
    });

    test('displays a single filter chip', () => {
      expect(queryByTestId('filter-chip0')).toBeInTheDocument();
    });

    test('displays filter chip label correctly', () => {
      expect(queryByText("fake attr = 'value'")).toBeInTheDocument();
    });

    test('does not display an AND chip', () => {
      expect(queryByText(/AND/i)).not.toBeInTheDocument();
    });

    test('cancel btn triggers handle Delete spy', () => {
      fireEvent.click(getByTestId('cancel-btn'));
      expect(handleDeleteSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Filter Group with 2 filters displays correctly', () => {
    let queryByText;

    beforeEach(() => {
      ({ queryByText } = render(
        <FilterGroup
          filterGroup={mockFilterGroups[2]}
          handleDelete={handleDeleteSpy}
        />,
      ));
    });

    test('display filter box', () => {
      expect(queryByText('multiple filters')).toBeInTheDocument();
    });

    test('displays both filter chips', () => {
      expect(queryByText("fake prop = 'value to fake prop'")).toBeInTheDocument();
      expect(queryByText("another fake prop CONTAINSTEXT 'mock text'")).toBeInTheDocument();
    });
  });

  test('Filter Group with linked records displays correctly', () => {
    const { queryByText } = render(
      <FilterGroup
        filterGroup={mockFilterGroups[3]}
        handleDelete={handleDeleteSpy}
      />,
    );

    expect(queryByText("fake prop = 'linked record name'")).toBeInTheDocument();
  });
});
