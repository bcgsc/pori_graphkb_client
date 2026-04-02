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

export const StringOptions = meta.story({
  args: {
    options: ['apple', 'banana', 'orange'],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Fruit')).toHaveValue('');
  },
});

export const StringOptionsWithValueSelect = meta.story({
  args: {
    options: ['apple', 'banana', 'orange'],
    value: 'apple',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Fruit')).toHaveValue('apple');
  },
});

export const WithCustomIcon = StringOptionsWithValueSelect.extend({
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
