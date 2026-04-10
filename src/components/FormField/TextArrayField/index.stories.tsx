import { expect, fn, within } from 'storybook/test';

import preview from '#.storybook/preview';

import Component from '.';

const meta = preview.meta({
  component: Component,
  args: {
    onChange: fn(),
    name: 'textArrayField',
    label: 'Text array field',
  },
});

export const Empty = meta.story();

Empty.test('adds value on Enter', async ({ canvas, userEvent }) => {
  // input the text and hit the enter key
  const input = canvas.getByLabelText('Text array field');
  await userEvent.type(input, 'someElement{Enter}');

  await expect(canvas.getByText('someElement')).toBeTruthy();
  await expect(canvas.getByLabelText<HTMLInputElement>('Text array field').value).toEqual('');
});

Empty.test('adds value on button click', async ({ canvas, userEvent }) => {
  const input = canvas.getByLabelText('Text array field');
  await userEvent.type(input, 'someElement');

  const button = canvas.getByLabelText('add');
  await userEvent.click(button);

  await expect(canvas.getByText('someElement')).toBeTruthy();
  await expect(canvas.getByLabelText<HTMLInputElement>('Text array field').value).toEqual('');
});

export const WithValues = meta.story({
  args: {
    value: ['thing 1', 'thing 2'],
  },
});

WithValues.test('deletes last added value with backspace', async ({ canvas, userEvent }) => {
  const input = canvas.getByLabelText('Text array field');
  await userEvent.type(input, 'someElement{Enter}');
  await expect(canvas.getByText('someElement')).toBeTruthy();

  await userEvent.type(input, '{Backspace}');

  await expect(canvas.queryByText('someElement')).toBeFalsy();
});

WithValues.test('does not delete added value with backspace if input isn\'t empty', async ({ canvas, userEvent }) => {
  const input = canvas.getByLabelText('Text array field');
  await userEvent.type(input, 'blargh');
  await expect(canvas.getByLabelText<HTMLInputElement>('Text array field').value).toEqual('blargh');
  await userEvent.type(input, '{Backspace}');
  await expect(canvas.getByLabelText<HTMLInputElement>('Text array field').value).toEqual('blarg');
  // should not have changed chips
  await expect(canvas.getByText('thing 1')).toBeTruthy();
  await expect(canvas.getByText('thing 2')).toBeTruthy();
});

WithValues.test('deletes when delete icon is clicked (new value)', async ({ canvas, userEvent }) => {
  const input = canvas.getByLabelText('Text array field');
  await userEvent.type(input, 'someElement{Enter}');

  // should now be a single chip element
  const chip = canvas.getByRole('button', { name: 'someElement' });
  await expect(chip).toBeTruthy();
  await expect(canvas.getByLabelText<HTMLInputElement>('Text array field').value).toEqual('');

  await userEvent.click(within(chip).getByLabelText('delete value'));
  // should not be any chips
  await expect(canvas.queryByText('someElement')).toBeFalsy();
});

WithValues.test('shows error when trying to add duplicate value', async ({ canvas, userEvent }) => {
  const chip = canvas.getByRole('button', { name: 'thing 2' });
  await expect(chip).toBeTruthy();

  // input the text and hit the enter key
  const input = canvas.getByLabelText('Text array field');
  await userEvent.type(input, 'thing 2{Enter}');

  await expect(canvas.getByText('Elements must be unique', { exact: false })).toBeTruthy();
  await expect(canvas.getAllByRole('button', { name: 'thing 2' })).toHaveLength(1);
});

export const WithHelperTextAndLabel = WithValues.extend({
  args: {
    helperText: 'this field is useful',
    label: 'List of subsets',
  },
});

export const WithError = WithValues.extend({
  args: { error: true, helperText: 'bad value' },
});

export const Disabled = WithValues.extend({
  args: { disabled: true },
});

export const Required = WithValues.extend({
  args: { required: true },
});

export const WithItemRestorable = WithValues.extend({
  play: async ({ canvas, userEvent }) => {
    const chip = canvas.getByRole('button', { name: 'thing 2' });
    await userEvent.click(within(chip).getByLabelText('delete value'));
    await expect(within(chip).queryByLabelText('delete value')).toBeFalsy();
    await expect(within(chip).getByLabelText('restore value')).toBeTruthy();
    await userEvent.tab();
  },
});

WithItemRestorable.test('deleted value is restored when restore icon is clicked', async ({ canvas, userEvent }) => {
  const chip = canvas.getByRole('button', { name: 'thing 2' });
  await expect(chip).toBeTruthy();
  await userEvent.click(within(chip).getByLabelText('restore value'));
  await expect(within(chip).getByLabelText('delete value')).toBeTruthy();
  await expect(within(chip).queryByLabelText('restore value')).toBeFalsy();
});
