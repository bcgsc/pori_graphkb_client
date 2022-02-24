import '@testing-library/jest-dom/extend-expect';

import { fireEvent, render } from '@testing-library/react';
import React from 'react';

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

  test('returns text on clicking submit', () => {
    const onSubmitSpy = jest.fn();
    const { getByTestId } = render(<SearchBox onSubmit={onSubmitSpy} value="blargh" />);
    const button = getByTestId('search-box__button');
    fireEvent.click(button);

    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    expect(onSubmitSpy).toHaveBeenCalledWith('blargh');
  });
});
