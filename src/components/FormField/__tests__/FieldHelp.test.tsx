import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import FieldHelp from '../FieldHelp';


describe('FieldHelp', () => {
  test('includes example if given', async () => {
    render(
      <FieldHelp description="does stuff" example="3" />,
    );
    const button = screen.getByLabelText('show tooltip');
    fireEvent.click(button);
    await expect(screen.findByText('does stuff (Example: 3)')).resolves.toBeTruthy();
  });

  test('returns null if no description or example', () => {
    render(
      <FieldHelp />,
    );
    expect(screen.queryByLabelText('show tooltip')).toBeFalsy();
  });

  test('ignores example if not given', async () => {
    render(
      <FieldHelp description="does stuff" />,
    );
    const button = screen.getByLabelText('show tooltip');
    fireEvent.click(button);
    await expect(screen.findByText('does stuff')).resolves.toBeTruthy();
  });
});
