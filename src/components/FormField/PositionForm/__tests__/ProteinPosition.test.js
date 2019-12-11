import '@testing-library/jest-dom/extend-expect';

import { render } from '@testing-library/react';
import React from 'react';

import ProteinPosition from '../ProteinPosition';


describe('ProteinPosition', () => {
  test('shows both fields', () => {
    const { getByText } = render(<ProteinPosition value={{}} />);
    expect(getByText(/\bposition\b.*/)).toBeInTheDocument();
    expect(getByText('refAA')).toBeInTheDocument();
  });
});
