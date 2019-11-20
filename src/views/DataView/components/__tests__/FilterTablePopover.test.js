import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import { render } from '@testing-library/react';

import FilterTablePopover from '../FilterTablePopover';

const mockFilters = {
  singleFilter: [
    ['conditions CONTAINS kras', ''],
  ],
  twoFilterGroups: [
    ['relevance = resistance', 'relevance = sensitivity'],
    ['reviewStatus = pending', 'reviewStatus = accepted'],
  ],
};

describe('FilterTablePopover', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let getByText;
  let getAllByText;
  let debug;

  describe('single Filter Group', () => {
    beforeEach(() => {
      ({
        getByText, getAllByText, debug,
      } = render(
        <FilterTablePopover
          anchorE1={null}
          filterGroups={mockFilters.singleFilter}
          handleToggle={() => {}}
          isOpen
        />,
      ));
    });

    test('renders correct number of filterGroups', () => {
      expect(getAllByText('FG')).toHaveLength(1);
    });

    test('renders correct filter chips', () => {
      expect(getByText('conditions CONTAINS kras')).toBeInTheDocument();
    });
  });

  describe('Two filter groups', () => {
    beforeEach(() => {
      ({
        getByText, getAllByText, debug,
      } = render(
        <FilterTablePopover
          anchorE1={null}
          filterGroups={mockFilters.twoFilterGroups}
          handleToggle={() => {}}
          isOpen
        />,
      ));
    });

    test('renders correct number of filterGroups', () => {
      debug();
      expect(getAllByText('FG')).toHaveLength(2);
    });

    test('renders correct filter chips', () => {
      expect(getByText('relevance = sensitivity')).toBeInTheDocument();
      expect(getByText('relevance = resistance')).toBeInTheDocument();
      expect(getByText('reviewStatus = pending')).toBeInTheDocument();
      expect(getByText('reviewStatus = accepted')).toBeInTheDocument();
    });
  });
});
