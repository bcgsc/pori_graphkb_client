import '@testing-library/jest-dom/extend-expect';

import { render } from '@testing-library/react';
import React from 'react';

import BasicPosition from '../BasicPosition';


describe('BasicPosition', () => {
  test('GenomicPosition variant shows only position field', () => {
    const { getByText, queryByText } = render(<BasicPosition value={{}} variant="GenomicPosition" />);
    expect(getByText('position')).toBeInTheDocument();
    expect(queryByText('offset')).not.toBeInTheDocument();
  });

  test('CdsPosition variant shows position and offset field', () => {
    const { getByText, queryByText } = render(<BasicPosition value={{}} variant="CdsPosition" />);
    expect(getByText('position')).toBeInTheDocument();
    expect(queryByText('offset')).toBeInTheDocument();
  });
});
