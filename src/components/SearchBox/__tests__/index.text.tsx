import '@testing-library/jest-dom/vitest';

import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import {
  beforeEach,
  describe, expect, test, vi,
} from 'vitest';

import SearchBox from '..';

describe('SearchBox', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('uses initial input value', () => {
    const { getByTestId } = render(<SearchBox onChange={vi.fn()} value="blargh" />);
    const inputElement = getByTestId('search-box__input');
    expect(inputElement).toHaveValue('blargh');
  });

  test('displays helper text', () => {
    const { getByText } = render(<SearchBox helperText="blargh" onChange={vi.fn()} />);
    expect(getByText('blargh')).toBeInTheDocument();
  });

  test('returns text on clicking submit', () => {
    const onSubmitSpy = vi.fn();
    const { getByTestId } = render(<SearchBox onChange={vi.fn()} onSubmit={onSubmitSpy} value="blargh" />);
    const button = getByTestId('search-box__button');
    fireEvent.click(button);

    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    expect(onSubmitSpy).toHaveBeenCalledWith('blargh');
  });
});
