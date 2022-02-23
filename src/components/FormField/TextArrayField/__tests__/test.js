import {
  Chip,
  IconButton,
  TextField,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import RefreshIcon from '@material-ui/icons/Refresh';
import {
  fireEvent, prettyDOM, render, screen,
} from '@testing-library/react';
import React from 'react';

import TextArrayField from '..';


describe('TextArrayField', () => {
  test('Add value with Enter', () => {
    render(
      <TextArrayField
        label="test"
        name="test"
        onChange={jest.fn()}
      />,
    );
    // input the text and hit the enter key
    fireEvent.keyDown(
      screen.getByLabelText('test'),
      { key: 'Enter', target: { value: 'someElement' } },
    );

    expect(screen.getByText('someElement')).toBeTruthy();
    expect(screen.getByLabelText('test').value).toEqual('');
  });

  test('Add value with button', () => {
    render(
      <TextArrayField
        label="test"
        name="test"
        onChange={jest.fn()}
      />,
    );
    // input the text
    fireEvent.change(
      screen.getByLabelText('test'),
      { target: { value: 'someElement' } },
    );

    const button = screen.getByLabelText('add');
    fireEvent.click(button);

    expect(screen.getByText('someElement')).toBeTruthy();
    expect(screen.getByLabelText('test').value).toEqual('');
  });

  test('Delete added value with backspace', () => {
    render(
      <TextArrayField
        label="test"
        name="test"
        onChange={jest.fn()}
      />,
    );
    // input the text and hit the enter key
    fireEvent.keyDown(
      screen.getByLabelText('test'),
      { key: 'Enter', target: { value: 'someElement' } },
    );
    // should now be a single chip element
    expect(screen.getByText('someElement')).toBeTruthy();
    expect(screen.getByLabelText('test').value).toEqual('');

    fireEvent.keyDown(
      screen.getByLabelText('test'),
      { key: 'Backspace', target: { value: '' } },
    );

    // should not be any chips
    expect(screen.queryByText('someElement')).toBeFalsy();
  });

  test('Delete added value with clear', () => {
    render(
      <TextArrayField
        label="test"
        name="test"
        onChange={jest.fn()}
      />,
    );
    // input the text and hit the enter key
    fireEvent.keyDown(
      screen.getByLabelText('test'),
      { key: 'Enter', target: { value: 'someElement' } },
    );

    // should now be a single chip element
    const chip = screen.getByText('someElement');
    expect(chip).toBeTruthy();
    expect(screen.getByLabelText('test').value).toEqual('');

    fireEvent.click(chip.nextElementSibling);
    // should not be any chips
    expect(screen.queryByText('someElement')).toBeFalsy();
  });

  test('Delete initial value with clear', () => {
    const onChange = jest.fn();
    render(
      <TextArrayField
        label="test"
        name="test"
        onChange={onChange}
        value={['someElement']}
      />,
    );

    const chip = screen.getByText('someElement');
    expect(chip).toBeTruthy();

    // now delete the newly added chip
    fireEvent.click(chip.nextElementSibling);
    // should not have any chips now
    expect(onChange).toHaveBeenCalledWith({
      target: {
        name: 'test',
        value: [],
      },
    });
  });

  test('Add duplicate value', () => {
    const onChange = jest.fn();
    render(
      <TextArrayField
        label="test"
        name="test"
        onChange={onChange}
        value={['someElement']}
      />,
    );

    const chip = screen.getByText('someElement');
    expect(chip).toBeTruthy();

    // input the text and hit the enter key
    fireEvent.keyDown(
      screen.getByLabelText('test'),
      { key: 'Enter', target: { value: 'someElement' } },
    );

    expect(screen.getByText('Elements must be unique', { exact: false })).toBeTruthy();
    // should now be a single chip element
    expect(onChange).not.toHaveBeenCalled();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
