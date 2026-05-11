import React from 'react';
import { MemoryRouter } from 'react-router';
import { expect, fn, screen } from 'storybook/test';

import preview from '#.storybook/preview';

import component from '.';

const meta = preview.meta({
  component,
});

export const LabelOnly = meta.story({
  args: {
    label: 'hello world',
  },
});

export const WithDetails = meta.story({
  args: {
    label: 'bob (#19:0)',
    details: {
      createdAt: 1587417608405,
      createdBy: '#2:5',
      name: 'bob',
      groups: [
        '#26:0',
      ],
      signedLicenseAt: 1587595458303,
      uuid: 'xxxx-xxxxx-xxxx-xxxx',
      email: 'bob@bcgsc.ca',
      loginCount: 17475,
      '@class': 'User',
      '@rid': '#19:0',
    },
  },
});

export const WithDetailsOpen = WithDetails.extend({
  play: async ({ canvas, userEvent }) => {
    const chip = canvas.getByText('bob (#19:0)');
    await userEvent.click(chip);
  },
});

export const WithDeleteHandler = WithDetails.extend({
  args: {
    onDelete: fn(),
  },

  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByTestId('CancelIcon'));
    await expect(args.onDelete).toHaveBeenCalled();
  },
});

export const WithGetLink = WithDetails.extend({
  args: {
    getLink: () => '/test',
  },
  play: async ({ canvas, userEvent }) => {
    const chip = canvas.getByText('bob (#19:0)');
    await userEvent.click(chip);
    const link = (await screen.findByLabelText('open in new tab')).closest('a');
    await expect(link).toHaveAttribute('href', '/test');
  },
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
});
