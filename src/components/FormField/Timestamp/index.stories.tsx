import { fn } from 'storybook/test';

import preview from '#.storybook/preview';

import Component from '.';

const meta = preview.meta({
  component: Component,
  args: {
    onChange: fn(),
    name: 'created',
    label: 'Created',
  },
});

export const Empty = meta.story();

export const Disabled = meta.story({
  args: { disabled: true },
});

export const WithValue = meta.story({
  args: {
    value: new Date(2020, 0, 1).getTime(),
  },
});

export const ReadOnly = WithValue.extend({
  args: { readOnly: true },
});

export const WithError = meta.story({
  args: {
    value: new Date(2020, 0, 1).getTime(),
    error: true,
    helperText: 'this is an error message',
  },
});
