import { fn } from 'storybook/test';

import preview, { http } from '#.storybook/preview';

import Component from '.';

const meta = preview.meta({
  component: Component,
  args: {
    onChange: fn(),
    name: 'search',
    linkedClassName: 'Variant',
    isMulti: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.gkb.query(() => [{ '@rid': '#15:1' }, { '@rid': '#15:2' }, { '@rid': '#15:3' }]),
      ],
    },
  },
});

export const Empty = meta.story();

export const WithFilterOptions = meta.story({
  args: {
    filterOptions: [
      'Variant',
      'Disease',
      'CatalogueVariant',
    ],
    defaultFilterClassName: 'Variant',
  },
});

export const WithValue = meta.story({
  args: {
    value: { '@rid': '#15:1' },
  },
});

export const Disabled = WithValue.extend({
  args: { disabled: true },
});

export const WithError = WithValue.extend({
  args: { error: true, helperText: 'bad value' },
});

export const WithMultipleValues = meta.story({
  args: {
    isMulti: true,
    value: [{ '@rid': '#15:1' }, { '@rid': '#15:2' }],
  },
});
