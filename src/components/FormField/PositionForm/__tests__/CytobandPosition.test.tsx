import '@testing-library/jest-dom/extend-expect';

import { render } from '@testing-library/react';
import React from 'react';
import {
  describe, expect, test, vi,
} from 'vitest';

import CytobandPosition from '../CytobandPosition';

describe('CytobandPosition', () => {
  test('shows all fields', () => {
    const { getByLabelText } = render(<CytobandPosition onChange={vi.fn()} value={{}} />);
    expect(getByLabelText(/arm/)).toBeInTheDocument();
    expect(getByLabelText('majorBand')).toBeInTheDocument();
    expect(getByLabelText('minorBand')).toBeInTheDocument();
  });

  test('uses input values', () => {
    const changeSpy = vi.fn();
    render(<CytobandPosition onChange={changeSpy} value={{ arm: 'p' }} />);
    expect(changeSpy).toHaveBeenCalledWith({ target: { name: '', value: { '@class': 'CytobandPosition', arm: 'p' } } });
  });
});
