import {
  expect, fn, screen,
} from 'storybook/test';

import { FORM_VARIANT } from '@/components/util';
import preview, { http } from '#.storybook/preview';

import Component from '.';

const meta = preview.meta({
  component: Component,
  args: {
    onChange: fn(),
    name: 'permissions',
    variant: FORM_VARIANT.EDIT,
  },
});

export const Empty = meta.story({
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Reviews')).toBeTruthy();
    await expect(canvas.getAllByRole('row')).toHaveLength(1);
  },
});

export const WithValue = meta.story({
  args: {
    values: [
      {
        '@class': 'StatementReview',
        createdBy: '#19:1',
        status: 'initial',
        createdAt: 1565376648434,
        comment: 'first',
      },
      {
        '@class': 'StatementReview',
        createdBy: '#19:0',
        status: 'initial',
        createdAt: 1565376648434,
        comment: 'second',
      }, {
        '@class': 'StatementReview',
        createdBy: '#19:0',
        status: 'initial',
        createdAt: 1565376648434,
        comment: 'third',
      },
    ],
  },
  parameters: {
    msw: {
      handlers: [
        http.gkb.query((body) => [{ '@class': 'User', '@rid': body.target as string, name: 'bob' }]),
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Reviews')).toBeTruthy();
    await expect(canvas.getAllByRole('row')).toHaveLength(4);
    await expect(canvas.findAllByText('bob (#19:1)')).resolves.toHaveLength(1);
    await expect(canvas.findAllByText('bob (#19:0)')).resolves.toHaveLength(2);
  },
});

export const WithDetails = WithValue.extend({
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByText('bob (#19:1)'));
    await expect(screen.findByText('created by bob')).resolves.toBeInTheDocument();
    await expect(screen.findByRole('button', { name: /delete/i })).resolves.toBeInTheDocument();
  },
});

export const WithDetailsAsViewVariant = WithValue.extend({
  args: {
    variant: FORM_VARIANT.VIEW,
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByText('bob (#19:1)'));
    await expect(screen.findByText('created by bob')).resolves.toBeInTheDocument();
    await expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  },
});

export const WithCreatedByAsObject = WithValue.extend({
  args: {
    values: [{
      '@class': 'StatementReview',
      createdBy: { '@rid': '#19:0', name: 'bob' },
      status: 'initial',
      createdAt: 1565376648434,
      comment: 'second',
    }],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Reviews')).toBeTruthy();
    await expect(canvas.getAllByRole('row')).toHaveLength(2);
    await expect(canvas.findByText('bob (#19:0)')).resolves.toBeInTheDocument();
  },
});
