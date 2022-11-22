import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import TextArrayField from '..';

describe('TextArrayField', () => {
  test('adds value on Enter', () => {
    render(
      <TextArrayField
        label="test"
        name="test"
        onChange={jest.fn()}
      />,
    );
    // input the text and hit the enter key
    const input = screen.getByLabelText('test');
    fireEvent.change(input, { target: { value: 'someElement' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('someElement')).toBeTruthy();
    expect(screen.getByLabelText('test').value).toEqual('');
  });

  test('adds value on button click', () => {
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

  test('deletes last added value with backspace', () => {
    const onChange = jest.fn();

    render(
      <TextArrayField
        label="test"
        name="test"
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText('test');

    const addValue = (text) => {
      // input the text and hit the enter key
      fireEvent.change(input, { target: { value: text } });
      fireEvent.keyDown(input, { key: 'Enter' });
      // should now be a chip element
      expect(screen.getByText(text)).toBeTruthy();
      expect(screen.getByLabelText('test').value).toEqual('');
    };

    addValue('value 1');
    addValue('value 2');
    addValue('value 3');

    fireEvent.keyDown(
      input,
      { key: 'Backspace' },
    );

    expect(screen.queryByText('value 3')).toBeFalsy();
    expect(onChange).toBeCalledTimes(4);
    expect(onChange).lastCalledWith({
      target: {
        name: 'test',
        value: ['value 1', 'value 2'],
      },
    });
  });

  test('does not delete added value with backspace if input isn\'t empty', () => {
    const onChange = jest.fn();
    render(
      <TextArrayField
        label="test"
        name="test"
        onChange={onChange}
      />,
    );
    // input the text and hit the enter key
    const input = screen.getByLabelText('test');
    fireEvent.change(input, { target: { value: 'someElement' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    // should now be a single chip element
    expect(screen.getByText('someElement')).toBeTruthy();
    expect(onChange).toHaveBeenCalledTimes(1);

    fireEvent.change(input, { target: { value: 'blargh' } });
    expect(screen.getByLabelText('test').value).toEqual('blargh');

    fireEvent.keyDown(
      input,
      { key: 'Backspace' },
    );

    // should not have changed chips
    expect(screen.getByText('someElement')).toBeTruthy();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('deletes when delete icon is clicked (new value)', () => {
    const onChange = jest.fn();
    render(
      <TextArrayField
        label="test"
        name="test"
        onChange={onChange}
      />,
    );
    // input the text and hit the enter key
    const input = screen.getByLabelText('test');
    fireEvent.change(input, { target: { value: 'someElement' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // should now be a single chip element
    const chip = screen.getByText('someElement');
    expect(chip).toBeTruthy();
    expect(screen.getByLabelText('test').value).toEqual('');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).lastCalledWith({
      target: {
        name: 'test',
        value: ['someElement'],
      },
    });

    fireEvent.click(chip.nextElementSibling);
    // should not be any chips
    expect(screen.queryByText('someElement')).toBeFalsy();
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).lastCalledWith({
      target: {
        name: 'test',
        value: [],
      },
    });
  });

  test('deletes value when delete icon is clicked', () => {
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
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).lastCalledWith({
      target: {
        name: 'test',
        value: [],
      },
    });
  });

  test('shows error when trying to add duplicate value', () => {
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
    const input = screen.getByLabelText('test');
    fireEvent.change(input, { target: { value: 'someElement' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('Elements must be unique', { exact: false })).toBeTruthy();
    // should now be a single chip element
    expect(onChange).not.toHaveBeenCalled();
  });

  test('deleted value is restored when restore icon is clicked', () => {
    const onChange = jest.fn();
    render(
      <TextArrayField
        label="test"
        name="test"
        onChange={onChange}
        value={['someElement']}
      />,
    );

    let chip = screen.getByText('someElement');
    fireEvent.click(chip?.nextElementSibling);

    expect(onChange).lastCalledWith({
      target: {
        name: 'test',
        value: [],
      },
    });

    chip = screen.getByText('someElement');
    fireEvent.click(chip?.nextElementSibling);

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).lastCalledWith({
      target: {
        name: 'test',
        value: ['someElement'],
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
