import {
  fireEvent, screen, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  describe, expect, test, vi,
} from 'vitest';

import { EmbeddedSet, EmbeddedSetEmpty, EmbeddedSetItemDeleted } from '../../index.stories';

describe('TextArrayField', () => {
  test('adds value on Enter', async () => {
    await EmbeddedSetEmpty.run();
    // input the text and hit the enter key
    const input = screen.getByLabelText('subsets');
    fireEvent.change(input, { target: { value: 'someElement' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('someElement')).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>('subsets').value).toEqual('');
  });

  test('adds value on button click', async () => {
    await EmbeddedSetEmpty.run();

    // input the text
    fireEvent.change(
      screen.getByLabelText('subsets'),
      { target: { value: 'someElement' } },
    );

    const button = screen.getByLabelText('add');
    fireEvent.click(button);

    expect(screen.getByText('someElement')).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>('subsets').value).toEqual('');
  });

  test('deletes last added value with backspace', async () => {
    await EmbeddedSet.run();

    // input the text
    const input = screen.getByLabelText('subsets');
    fireEvent.change(input, { target: { value: 'someElement' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('someElement')).toBeTruthy();

    fireEvent.keyDown(
      input,
      { key: 'Backspace' },
    );

    expect(screen.queryByText('someElement')).toBeFalsy();
  });

  test('does not delete added value with backspace if input isn\'t empty', async () => {
    await EmbeddedSet.run();
    const input = screen.getByLabelText('subsets');

    fireEvent.change(input, { target: { value: 'blargh' } });
    expect(screen.getByLabelText<HTMLInputElement>('subsets').value).toEqual('blargh');

    fireEvent.keyDown(
      input,
      { key: 'Backspace' },
    );

    // should not have changed chips
    expect(screen.getByText('thing 1')).toBeTruthy();
    expect(screen.getByText('thing 2')).toBeTruthy();
  });

  test('deletes when delete icon is clicked (new value)', async () => {
    await EmbeddedSet.run();
    // input the text and hit the enter key
    const input = screen.getByLabelText('subsets');
    fireEvent.change(input, { target: { value: 'someElement' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // should now be a single chip element
    const chip = screen.getByRole('button', { name: 'someElement' });
    expect(chip).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>('subsets').value).toEqual('');

    fireEvent.click(within(chip).getByLabelText('delete value'));
    // should not be any chips
    expect(screen.queryByText('someElement')).toBeFalsy();
  });

  test('shows error when trying to add duplicate value', async () => {
    await EmbeddedSet.run();
    const chip = screen.getByRole('button', { name: 'thing 2' });
    expect(chip).toBeTruthy();

    // input the text and hit the enter key
    const input = screen.getByLabelText('subsets');
    fireEvent.change(input, { target: { value: 'thing 2' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('Elements must be unique', { exact: false })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'thing 2' })).toHaveLength(1);
  });

  test('deleted value is restored when restore icon is clicked', async () => {
    const user = userEvent.setup();
    await EmbeddedSetItemDeleted.run({ userEvent: user });
    const chip = screen.getByRole('button', { name: 'thing 2' });
    expect(chip).toBeTruthy();
    fireEvent.click(within(chip).getByLabelText('restore value'));
    expect(within(chip).getByLabelText('delete value')).toBeTruthy();
    expect(within(chip).queryByLabelText('restore value')).toBeFalsy();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
