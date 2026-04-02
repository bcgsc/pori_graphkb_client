import { expect, fn, screen } from 'storybook/test';

import preview from '#.storybook/preview';

import component from '.';

const meta = preview.meta({
  component,
  args: { onClick: fn(), children: 'Action' },
});

export const NoConfirmRequired = meta.story({
  args: {
    requireConfirm: false,
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('Action'));
    await expect(args.onClick).toHaveBeenCalled();
  },
});

export const WithConfirmRequired = meta.story({
  args: {
    requireConfirm: true,
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('Action'));
    await expect(args.onClick).not.toHaveBeenCalled();
    await userEvent.click(await screen.findByText('Confirm'));
    await expect(args.onClick).toHaveBeenCalled();
  },
});

export const Disabled = meta.story({
  args: {
    disabled: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Action')).toBeDisabled();
  },
});

export const WithCustomMessage = meta.story({
  args: {
    message: 'Are you sure you want to delete this record?',
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('Action'));
    await expect(screen.findByText('Are you sure you want to delete this record?')).resolves.toBeInTheDocument();
  },
});
