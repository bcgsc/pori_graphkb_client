import { expect } from 'storybook/test';

import preview from '#.storybook/preview';

import Component from '.';

const meta = preview.meta({
  component: Component,
});

export const NoOptions = meta.story({
  args: {
    options: [],
  },
});

export const StringOptions = meta.story({
  args: {
    options: ['apple', 'banana', 'orange'],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('apple')).not.toBeChecked();
    await expect(canvas.getByLabelText('orange')).not.toBeChecked();
    await expect(canvas.getByLabelText('banana')).not.toBeChecked();
  },
});

export const StringOptionsWithValueSelected = StringOptions.extend({
  args: {
    value: 'apple',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('apple')).toBeChecked();
    await expect(canvas.getByLabelText('orange')).not.toBeChecked();
    await expect(canvas.getByLabelText('banana')).not.toBeChecked();
  },
});

export const ComplexOptions = meta.story({
  args: {
    options: [
      {
        key: 'apple', value: 'apple', label: 'apple', caption: 'this the most basic fruit',
      },
      {
        key: 'orange', value: 'orange', label: 'orange', caption: 'contensious, rhymes with nothing',
      },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('apple')).not.toBeChecked();
    await expect(canvas.getByText('this the most basic fruit')).toBeInTheDocument();
    await expect(canvas.getByLabelText('orange')).not.toBeChecked();
    await expect(canvas.getByText('contensious, rhymes with nothing')).toBeInTheDocument();
  },
});

export const ComplexOptionsWithValueSelected = ComplexOptions.extend({
  args: {
    value: 'orange',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('apple')).not.toBeChecked();
    await expect(canvas.getByLabelText('orange')).toBeChecked();
  },
});
