import { fn } from 'storybook/test';

import preview, { withAuth, withRouter } from '#.storybook/preview';

import Component from './MainNav';

const meta = preview.meta({
  component: Component,
  decorators: [withAuth, withRouter],
  args: {
    onChange: fn(),
  },
  title: 'Components/MainNav',
});

export const Closed = meta.story();

export const Open = meta.story({
  args: { isOpen: true },
});

export const OpenWithWriteAccess = Open.extend({
  args: { auth: { hasWriteAccess: true } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByText(/add new record/i));
  },
});

export const OpenAsAdmin = Open.extend({
  args: { auth: { hasWriteAccess: true, isAdmin: true } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByText(/add new record/i));
  },
});
