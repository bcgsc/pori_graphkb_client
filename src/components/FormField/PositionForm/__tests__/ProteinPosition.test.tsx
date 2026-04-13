import '@testing-library/jest-dom/vitest';

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, test } from 'vitest';

import ProteinPosition from '../ProteinPosition';

describe('ProteinPosition', () => {
  test('shows both fields', () => {
    const { getByLabelText } = render(<ProteinPosition value={{}} />);
    expect(getByLabelText(/position/)).toBeInTheDocument();
    expect(getByLabelText('refAA')).toBeInTheDocument();
  });
});
