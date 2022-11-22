import '@testing-library/jest-dom/extend-expect';

import { render } from '@testing-library/react';
import React from 'react';

import CytobandPosition from '../CytobandPosition';

describe('CytobandPosition', () => {
  test('shows all fields', () => {
    const { getByText } = render(<CytobandPosition onChange={jest.fn()} value={{}} />);
    expect(getByText(/\barm\b.*/)).toBeInTheDocument();
    expect(getByText('majorBand')).toBeInTheDocument();
    expect(getByText('minorBand')).toBeInTheDocument();
  });

  test('uses input values', () => {
    const changeSpy = jest.fn();
    render(<CytobandPosition onChange={changeSpy} value={{ arm: 'p' }} />);
    expect(changeSpy).toHaveBeenCalledWith({ target: { name: '', value: { '@class': 'CytobandPosition', arm: 'p' } } });
  });
});
