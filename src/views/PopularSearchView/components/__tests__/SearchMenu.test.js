import '@testing-library/jest-dom/extend-expect';

import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import SearchMenu from '../SearchMenu';

const MOCK_SEARCH_OPTS = {
  GENE: [
    {
      label: 'gene label 1',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
    },
    {
      label: 'gene label 2',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
    },
  ],
};

describe('SearchMenu', () => {
  afterEach(() => jest.clearAllMocks());

  const changeSpy = jest.fn();
  let getByText;
  let getAllByText;

  describe('GENE Variant', () => {
    const labels = MOCK_SEARCH_OPTS.GENE.map(opt => opt.label);
    const selectedOpt = 0;


    beforeEach(() => {
      ({ getByText, getAllByText } = render(
        <SearchMenu
          handleChange={changeSpy}
          labels={labels}
          value={selectedOpt}
        />,
      ));
    });

    test('displays first option', () => {
      expect(getByText('gene label 1')).toBeInTheDocument();
    });

    test('displays second option', () => {
      expect(getByText('gene label 2')).toBeInTheDocument();
    });

    test('displays correct number of options', () => {
      expect(getAllByText(/gene/i)).toHaveLength(2);
    });

    test('calls change handler with correct search option selected', () => {
      fireEvent.click(getByText('gene label 2'));
      expect(changeSpy).toHaveBeenCalledTimes(1);
      expect(changeSpy).toHaveBeenCalledWith(1);

      fireEvent.click(getByText('gene label 1'));
      expect(changeSpy).toHaveBeenCalledTimes(2);
      expect(changeSpy).toHaveBeenCalledWith(0);
    });
  });
});
