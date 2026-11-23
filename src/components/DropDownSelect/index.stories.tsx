import { expect, fn } from 'storybook/test';

import preview from '#.storybook/preview';

import component from '.';

const meta = preview.meta({
  component,
  args: {
    onChange: fn(),
    label: 'Fruit',
  },
});

export const Empty = meta.story({
  args: {
    options: ['apple', 'banana', 'orange'],
  },
});

export const WithValue = meta.story({
  args: {
    options: ['apple', 'banana', 'orange'],
    value: 'apple',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Fruit')).toHaveTextContent('apple');
  },
});

export const Disabled = WithValue.extend({
  args: { disabled: true },
});

export const ReadOnly = WithValue.extend({
  args: { readOnly: true },
});

export const ReadOnlyWithInvalidValue = Empty.extend({
  args: { readOnly: true, value: 'invalid' },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Fruit')).toHaveTextContent('invalid');
  },
});

export const WithError = WithValue.extend({
  args: { error: true, helperText: 'bad value' },
});

export const ComplexOptionsWithValueSelect = meta.story({
  args: {
    options: ['apple', { value: 'banana', label: 'yellow banana' }],
    value: 'apple',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Fruit')).toHaveTextContent('apple');
  },
});
