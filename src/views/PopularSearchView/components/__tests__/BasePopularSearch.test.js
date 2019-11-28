import '@testing-library/jest-dom/extend-expect';

import {
  fireEvent,
  render,
} from '@testing-library/react';
import React from 'react';

import BasePopularSearch from '../BasePopularSearch';

jest.mock('../util', () => ({
  batch1: [
    {
      label: 'batch1 option1',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. Adriamycin',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              subject: ['drug therapy rids'], operator: 'IN',
            },
            {
              relevance: 'relevance rid', operator: '=',
            },
          ],
        },
      },
    },
    {
      label: 'batch1 option2',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. Adriamycin',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              subject: ['drug therapy rids'], operator: 'IN',
            },
            {
              relevance: 'relevance rid', operator: '=',
            },
          ],
        },
      },
    },
  ],
  batch2: [
    {
      label: 'batch2 option1',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. Adriamycin',
      },
      additionalInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer', optional: false,
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              subject: ['drug therapy rids'], operator: 'IN',
            },
            {
              relevance: 'relevance rid', operator: '=',
            },
          ],
        },
      },
    },
  ],
}));

describe('PopularSearchView', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('First batch of test options', () => {
    let getByTestId;
    let getByText;
    let getAllByText;

    const onErrorSpy = jest.fn();
    const onSubmitSpy = jest.fn();

    beforeEach(() => {
      ({
        getByTestId, getByText, getAllByText,
      } = render(
        <BasePopularSearch
          onError={onErrorSpy}
          onSubmit={onSubmitSpy}
          variant="batch1"
        />,
      ));
    });

    test('displays search options correctly', () => {
      const searchOptions = getAllByText(/batch1 option/i);
      expect(searchOptions.length).toBe(2);
    });

    test('toggles between selection properly', () => {
      const searchOptions = getAllByText(/batch1 option/i);
      const [, secondOpt] = searchOptions;
      const selectionContainer = secondOpt.closest('div');
      expect(selectionContainer.className).toBe('popular-search__menu-item'); // not selected

      const secondOptBtn = secondOpt.closest('button');
      fireEvent.click(secondOptBtn);
      expect(selectionContainer.className).toBe('popular-search__menu-item--selected');
    });

    test('search btn is displayed correctly', () => {
      const searchBtn = getByText('Search');
      expect(searchBtn).toBeInTheDocument();
      expect(searchBtn).toBeDisabled();
    });

    test('input triggers search btn to display correctly', () => {
      fireEvent.change(getByTestId('search-input'), { target: { value: 'kras' } });
      const searchBtn = getByText('Search');
      expect(searchBtn).toBeInTheDocument();
      expect(searchBtn).not.toBeDisabled();
    });

    test('search triggers onSubmit handler correctly', () => {
      fireEvent.change(getByTestId('search-input'), { target: { value: 'kras' } });
      const searchBtn = getByText('Search');
      fireEvent.click(searchBtn);
      expect(onSubmitSpy).toHaveBeenCalledTimes(1);
      expect(onSubmitSpy).toHaveBeenCalledWith('complex=eyJ0YXJnZXQiOiJTdGF0ZW1lbnQiLCJmaWx0ZXJzIjp7IkFORCI6W3sic3ViamVjdCI6WyJkcnVnIHRoZXJhcHkgcmlkcyJdLCJvcGVyYXRvciI6IklOIn0seyJyZWxldmFuY2UiOiJyZWxldmFuY2UgcmlkIiwib3BlcmF0b3IiOiI9In1dfX0%253D&%40class=Statement');
    });
  });

  describe('second option batch with optional inputs', () => {
    let getByTestId;
    let getByText;
    let getAllByText;

    const onErrorSpy = jest.fn();
    const onSubmitSpy = jest.fn();

    beforeEach(() => {
      ({
        getByTestId, getByText, getAllByText,
      } = render(
        <BasePopularSearch
          onError={onErrorSpy}
          onSubmit={onSubmitSpy}
          variant="batch2"
        />,
      ));
    });

    test('displays search options correctly', () => {
      const searchOptions = getAllByText(/batch2 option/i);
      expect(searchOptions.length).toBe(1);
    });

    test('search btn is displayed correctly', () => {
      const searchBtn = getByText('Search');
      expect(searchBtn).toBeInTheDocument();
      expect(searchBtn).toBeDisabled();
    });

    test('search btn is enabled correctly with required addtional input', () => {
      fireEvent.change(getByTestId('search-input'), { target: { value: 'kras' } });
      const searchBtn = getByText('Search');
      expect(searchBtn).toBeInTheDocument();
      expect(searchBtn).toBeDisabled(); // search btn should still be disabled

      fireEvent.change(getByTestId('additional-input'), { target: { value: 'kras' } });
      expect(searchBtn).not.toBeDisabled();
    });

    test('search fires correcly with additional input', () => {
      const searchBtn = getByText('Search');
      fireEvent.change(getByTestId('search-input'), { target: { value: 'kras' } });
      fireEvent.change(getByTestId('additional-input'), { target: { value: 'tp53' } });
      fireEvent.click(searchBtn);
      expect(onSubmitSpy).toHaveBeenCalledTimes(1);
      expect(onSubmitSpy).toHaveBeenCalledWith('complex=eyJ0YXJnZXQiOiJTdGF0ZW1lbnQiLCJmaWx0ZXJzIjp7IkFORCI6W3sic3ViamVjdCI6WyJkcnVnIHRoZXJhcHkgcmlkcyJdLCJvcGVyYXRvciI6IklOIn0seyJyZWxldmFuY2UiOiJyZWxldmFuY2UgcmlkIiwib3BlcmF0b3IiOiI9In1dfX0%253D&%40class=Statement');
    });
  });
});
