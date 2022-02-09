import '@testing-library/jest-dom/extend-expect';

import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import RecordFormStateToggle from '..';

describe('RecordFormStateToggle', () => {
  let getByText;
  const clickSpy = jest.fn();

  beforeEach(() => {
    ({ getByText } = render((
      <RecordFormStateToggle
        allowEdit
        message="Changes you will lose"
        onClick={clickSpy}
        value="view"
      />
    )));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('shows graph button', () => {
    expect(getByText('Graph')).toBeInTheDocument();
  });

  test('shows edit button', () => {
    expect(getByText('Edit')).toBeInTheDocument();
  });

  test('shows view button', () => {
    expect(getByText('View')).toBeInTheDocument();
  });

  test('onClick handler returns new state', () => {
    const edit = getByText('Edit');
    fireEvent.click(edit);
    expect(clickSpy).toHaveBeenCalledWith('edit');
  });
});
