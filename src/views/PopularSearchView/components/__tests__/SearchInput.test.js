import '@testing-library/jest-dom/extend-expect';

import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import SearchInput from '../SearchInput';

const mockSelectedOption = {
  label: 'variant label 1',
  requiredInput: {
    label: 'Variant', property: 'name', class: 'Variant', example: 'Ex. KRAS:p.G12A',
  },
  additionalInput: {
    label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
  },
};

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
          selectedOption={mockSelectedOption}
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
      // clears inputs on mounting to handle option selection change
      expect(changeSpy).toHaveBeenCalledTimes(1);
      fireEvent.change(getByTestId('search-input'), { target: { value: 'Changed!' } });
      expect(changeSpy).toHaveBeenCalledTimes(2);
    });
  });
});
