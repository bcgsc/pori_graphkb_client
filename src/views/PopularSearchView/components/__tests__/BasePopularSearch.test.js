import '@testing-library/jest-dom/extend-expect';

import {
  fireEvent,
  render,
} from '@testing-library/react';
import React from 'react';

import BasePopularSearch from '../BasePopularSearch';

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
          variant="GENE"
        />,
      ));
    });

    test('displays search options correctly', () => {
      const searchOptions = getAllByText(/Gene/i);
      expect(searchOptions.length).toBe(5); // 3 menu options, label, and input box
    });

    test('toggles between selection properly', () => {
      const secondOpt = getByText(/find a specific disease/i);
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
      expect(onSubmitSpy).toHaveBeenCalledWith('%40class=Statement&complex=eyJ0YXJnZXQiOiJTdGF0ZW1lbnQiLCJmaWx0ZXJzIjp7ImNvbmRpdGlvbnMiOnsicXVlcnlUeXBlIjoia2V5d29yZCIsImtleXdvcmQiOiJrcmFzIiwidGFyZ2V0IjoiVmFyaWFudCJ9LCJvcGVyYXRvciI6IkNPTlRBSU5TQU5ZIn19');
    });
  });

  describe('second option batch with optional inputs', () => {
    let getByTestId;
    let getByText;

    const onErrorSpy = jest.fn();
    const onSubmitSpy = jest.fn();

    beforeEach(() => {
      ({
        getByTestId, getByText,
      } = render(
        <BasePopularSearch
          onError={onErrorSpy}
          onSubmit={onSubmitSpy}
          variant="GENE"
        />,
      ));
      fireEvent.click(getByText(/specific disease/i));
    });

    test('displays search sub-menu options', () => {
      const firstOption = getByText(/for all diseases/i);
      expect(firstOption).toBeInTheDocument();

      const secondOption = getByText(/find a specific disease/i);
      expect(secondOption).toBeInTheDocument();

      const thirdOption = getByText(/linked with drug/i);
      expect(thirdOption).toBeInTheDocument();
    });

    test('search btn is diasbled before input', () => {
      const searchBtn = getByText('Search');
      expect(searchBtn).toBeInTheDocument();
      expect(searchBtn).toBeDisabled();
    });

    test('search btn is enabled after input', () => {
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
      expect(onSubmitSpy).toHaveBeenCalledWith('%40class=Statement&complex=eyJ0YXJnZXQiOiJTdGF0ZW1lbnQiLCJmaWx0ZXJzIjp7IkFORCI6W3siY29uZGl0aW9ucyI6eyJxdWVyeVR5cGUiOiJrZXl3b3JkIiwia2V5d29yZCI6ImtyYXMiLCJ0YXJnZXQiOiJWYXJpYW50In0sIm9wZXJhdG9yIjoiQ09OVEFJTlNBTlkifSx7ImNvbmRpdGlvbnMiOnsicXVlcnlUeXBlIjoia2V5d29yZCIsImtleXdvcmQiOiJ0cDUzIiwidGFyZ2V0IjoiRGlzZWFzZSJ9LCJvcGVyYXRvciI6IkNPTlRBSU5TQU5ZIn1dfX0%253D');
    });
  });
});
