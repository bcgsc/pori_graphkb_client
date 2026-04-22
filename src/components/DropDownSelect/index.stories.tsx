import { Person } from '@mui/icons-material';
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
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Fruit')).toHaveValue('');
  },
});

export const WithValue = meta.story({
  args: {
    options: ['apple', 'banana', 'orange'],
    value: 'apple',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Fruit')).toHaveValue('apple');
  },
});

export const Disabled = WithValue.extend({
  args: { disabled: true },
});

export const ReadOnly = WithValue.extend({
  args: { readOnly: true },
});

export const WithError = WithValue.extend({
  args: { error: true, helperText: 'bad value' },
});

export const WithCustomIcon = WithValue.extend({
  args: {
    IconComponent: Person,
  },
});

export const ComplexOptionsWithValueSelect = meta.story({
  args: {
    options: ['apple', { value: 'banana', label: 'yellow banana' }],
    value: 'apple',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Fruit')).toHaveValue('apple');
  },
});
