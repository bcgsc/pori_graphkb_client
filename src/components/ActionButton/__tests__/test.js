import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import ActionButton from '..';


describe('ActionButton', () => {
  const onClick = jest.fn();

  test('uses onClick when requireConfirm flag is false', () => {
    render(
      <ActionButton
        onClick={onClick}
        requireConfirm={false}
        title="action"
      >
        action
      </ActionButton>,
    );

    fireEvent.click(screen.getByText('action'));
    // check that the onClick handler was called
    expect(onClick).toHaveBeenCalled();
    // check that the confimation Dialog box was not rendered
    expect(screen.queryByText('Confirm')).toBeFalsy();
  });

  test('does not use onClick when requireConfirm flag is given', () => {
    render(
      <ActionButton
        onClick={onClick}
        requireConfirm
        title="action"
      >
        action
      </ActionButton>,
    );

    fireEvent.click(screen.getByText('action'));
    // check that the onClick handler was not called
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByText('Confirm')).toBeTruthy();
  });

  test.todo('currently cannot test confirm or cancel clicks since the dialog contents renders outside the wrapper element');

  afterEach(() => {
    jest.resetAllMocks();
  });
});
