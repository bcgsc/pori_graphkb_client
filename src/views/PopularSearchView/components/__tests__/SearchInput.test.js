import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import SearchInput from '../SearchInput';
import MOCK_SEARCH_OPTS from './mockData';

describe('Search Input', () => {
  afterEach(() => jest.clearAllMocks());

  describe('VARIANT Search Option', () => {
    let getByText;
    let getAllByText;
    let getByTestId;
    const changeSpy = jest.fn();
    const optionalChangeSpy = jest.fn();

    beforeEach(() => {
      ({ getByText, getAllByText, getByTestId } = render(
        <SearchInput
          handleInputChange={changeSpy}
          handleOptionalChange={optionalChangeSpy}
          selectedOption={MOCK_SEARCH_OPTS.VARIANT[0]}
        />,
      ));
    });

    test('displays example text', () => {
      expect(getByText('Ex. KRAS:p.G12A')).toBeInTheDocument();
    });

    test('displays correct label', () => {
      expect(getByText('Variant')).toBeInTheDocument();
    });

    test('displays optional input', () => {
      expect(getByText('Ex. Cancer')).toBeInTheDocument();
    });

    test('displays correct number of inputs', () => {
      expect(getAllByText(/Ex/i)).toHaveLength(2);
    });

    test('Displays search button correctly', () => {
      expect(getByText('Search')).toBeInTheDocument();
    });

    test('input triggers change handlers', () => {
      fireEvent.change(getByTestId('content-input'), { target: { value: 'Clicked! ' } });
      expect(changeSpy).toHaveBeenCalledTimes(1);
    });
  });
});
