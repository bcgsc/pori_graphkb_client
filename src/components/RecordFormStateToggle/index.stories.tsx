import { expect, fn, screen } from 'storybook/test';

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

ViewSelectedEditAllowed.test('onClick handler returns new state', async ({ canvas, userEvent, args }) => {
  await userEvent.click(canvas.getByText('Edit'));
  await expect(args.onClick).toHaveBeenCalledWith('edit');
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

RequireConfirm.test('callback is called when confirmed', async ({ canvas, userEvent, args }) => {
  const viewBtn = canvas.getByRole('button', { name: /view/i });
  await expect(viewBtn).not.toBePressed();
  await userEvent.click(viewBtn);
  await userEvent.click(screen.getByText(/confirm/i));
  expect(args.onClick).toHaveBeenCalled();
});

RequireConfirm.test('callback is not called when user cancels', async ({ canvas, userEvent, args }) => {
  const viewBtn = canvas.getByRole('button', { name: /view/i });
  await expect(viewBtn).not.toBePressed();
  await userEvent.click(viewBtn);
  await userEvent.click(screen.getByText(/cancel/i));
  expect(args.onClick).not.toHaveBeenCalled();
});
