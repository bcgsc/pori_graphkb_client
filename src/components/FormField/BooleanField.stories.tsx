import { fn } from 'storybook/test';

import preview from '#.storybook/preview';

import Component from './BooleanField';

const meta = preview.meta({
  component: Component,
  args: {
    onChange: fn(),
    name: 'permissions',
  },
});

export const Empty = meta.story();

export const False = Empty.extend({
  args: { value: false },
});

export const True = Empty.extend({
  args: { value: true },
});

export const Disabled = False.extend({
  args: { disabled: true },
});

export const WithError = False.extend({
  args: { error: true, helperText: 'bad value' },
});
