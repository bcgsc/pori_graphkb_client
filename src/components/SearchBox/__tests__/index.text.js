import '@testing-library/jest-dom/extend-expect';

import { act, fireEvent, render } from '@testing-library/react';
import React from 'react';
import sleep from 'sleep-promise';

import SearchBox from '..';


describe('SearchBox', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('uses initial input value', () => {
    const { getByTestId } = render(<SearchBox value="blargh" />);
    const inputElement = getByTestId('search-box__input');
    expect(inputElement).toHaveValue('blargh');
  });

  test('displays helper text', () => {
    const { getByText } = render(<SearchBox helperText="blargh" />);
    expect(getByText('blargh')).toBeInTheDocument();
  });

  test('debounces reporting changes to handler', async () => {
    const onChangeSpy = jest.fn();
    const debounceTime = 10;
    const { getByTestId } = render(<SearchBox onChange={onChangeSpy} debounceMs={debounceTime} />);
    const inputElement = getByTestId('search-box__input');
    act(() => {
      fireEvent.change(inputElement, { target: { value: 'blargh' } });
      fireEvent.change(inputElement, { target: { value: 'blargh2' } });
    });

    expect(getByTestId('search-box__input')).toHaveValue('blargh2');
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    await act(async () => {
      // state update is in debounce so this needs to be wrapped in act
      await sleep(debounceTime * 2);
    });
    expect(onChangeSpy).toHaveBeenCalledTimes(2);
    expect(onChangeSpy).toHaveBeenNthCalledWith(2, 'blargh2');
  });
});
