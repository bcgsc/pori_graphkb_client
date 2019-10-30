import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import {
  render, fireEvent, act,
} from '@testing-library/react';


import AdvancedSearchView from '..';


describe('AdvancedSearchView', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockPush = jest.fn();

  const mockHistory = {
    push: event => mockPush(event),
  };

  describe('AdvancedSearchView renders correctly', () => {
    let getByTestId;
    let getByText;
    let debug;

    beforeEach(() => {
      ({
        getByTestId, getByText, debug,
      } = render(
        <AdvancedSearchView
          history={mockHistory}
          modelName="Statement"
        />,
      ));
    });

    test('renders class select correctly', () => {
      expect(getByText('Statement')).toBeInTheDocument();
      expect(getByText('@class type to be queried')).toBeInTheDocument();
      expect(getByText('Decomposed sentences linking variants and ontological terms to implications and evidence')).toBeInTheDocument();
    });

    test('renders add new filter box correctly', () => {
      expect(getByText('Add New Filter')).toBeInTheDocument();
      expect(getByText('properties')).toBeInTheDocument();
    });

    test('add filter button is disabled on render', async () => {
      expect(getByText('ADD FILTER')).toBeInTheDocument();
      expect(getByText('ADD FILTER')).toBeDisabled();
    });

    test('search button fires correctly', () => {
      fireEvent.click(getByText('Search'));
      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/data/table?complex=eyJ0YXJnZXQiOiJTdGF0ZW1lbnQifQ%253D%253D&%40class=Statement');
    });

    test('fires prop select correctly', () => {
      fireEvent.change(getByTestId('prop-select'), { target: { value: '@rid' } });
    });

    test('fires value select correctly', () => {
      fireEvent.change(getByTestId('prop-select'), { target: { value: 'relevance' } });
      fireEvent.change(getByTestId('value-select'), { target: { value: 'resistance' } });
      expect(getByText('ADD FILTER')).toBeInTheDocument();
      expect(getByText('ADD FILTER')).toBeDisabled();
    });

    test('fires operator changes correct', () => {
      fireEvent.change(getByTestId('prop-select'), { target: { value: 'relevance' } });
      fireEvent.change(getByTestId('value-select'), { target: { value: 'resistance' } });
      fireEvent.change(getByTestId('operator-select'), { target: { value: '=' } });
      expect(getByText('ADD FILTER')).toBeInTheDocument();
      expect(getByText('ADD FILTER')).toBeDisabled();
      debug();
    });
  });
});
