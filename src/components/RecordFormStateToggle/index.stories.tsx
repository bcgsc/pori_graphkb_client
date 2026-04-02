import { expect, fn } from 'storybook/test';

import preview from '#.storybook/preview';

import { FORM_VARIANT } from '../util';
import component from '.';

const meta = preview.meta({
  component,
  args: { onClick: fn() },
});

export const ViewSelected = meta.story({
  args: {
    value: FORM_VARIANT.VIEW,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /graph/i })).not.toBePressed();
    await expect(canvas.getByRole('button', { name: /view/i })).toBePressed();
    await expect(canvas.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  },
});

export const ViewSelectedEditAllowed = ViewSelected.extend({
  args: {
    allowEdit: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /graph/i })).not.toBePressed();
    await expect(canvas.getByRole('button', { name: /view/i })).toBePressed();
    await expect(canvas.getByRole('button', { name: /edit/i })).not.toBePressed();
  },
});

export const RequireConfirm = meta.story({
  args: {
    allowEdit: true,
    value: FORM_VARIANT.EDIT,
    message: 'Changes you will lose',
    requireConfirm: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /edit/i })).toBePressed();
    const viewBtn = canvas.getByRole('button', { name: /view/i });
    await expect(viewBtn).not.toBePressed();
  },
});
