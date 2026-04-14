import { expect, fn, screen } from 'storybook/test';

import preview, { http } from '#.storybook/preview';

import component from '.';

const bob = {
  '@rid': '#1:1',
  '@class': 'User',
  name: 'bob',
};

const alice = {
  '@rid': '#2:1',
  '@class': 'User',
  name: 'alice',
};

const meta = preview.meta({
  component,
  args: {
    onChange: fn(),
    name: 'fieldName',
    getQueryBody: () => ({}),
    label: 'Users',
  },
  parameters: {
    msw: {
      handlers: [
        http.gkb.query(() => [bob, alice]),
      ],
    },
  },
});

export const Empty = meta.story({
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('Search Records by Name or ID')).not.toBeRequired();
  },
});

export const WithPlaceholder = meta.story({
  args: { placeholder: 'blargh monkeys' },
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText('blargh monkeys')).not.toBeRequired();
  },
});

export const Required = meta.story({
  args: { required: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/Users/)).toBeRequired();
  },
});

export const WithValue = meta.story({
  args: { value: bob },
  play: async ({ canvas }) => {
    await expect(canvas.findByText('bob (#1:1)')).resolves.toBeInTheDocument();
  },
});

export const Disabled = WithValue.extend({
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.findByText('bob (#1:1)')).resolves.toBeInTheDocument();
    await expect(canvas.findByLabelText(/Users/)).resolves.toBeDisabled();
  },
});

export const WithError = WithValue.extend({
  args: { errorText: 'bad value' },
});

export const MultiWithValue = WithValue.extend({
  args: { isMulti: true },
});

export const MultiWithValueFocused = MultiWithValue.extend({
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByLabelText(/Users/));
    // not sure options showing here is desired behaviour
    await expect(screen.getByText(/no options/i)).toBeInTheDocument();
    await userEvent.keyboard('{Esc}');
    await expect(canvas.getByText(/requires 1 or more characters to search/i)).toBeInTheDocument();
  },
});

export const MultiWithValueAfterFocus = MultiWithValue.extend({
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByLabelText(/Users/));
    await userEvent.tab();
    await expect(canvas.findByText(/May take more than one value/i)).resolves.toBeInTheDocument();
  },
});

export const MultiWithMultipleValues = WithValue.extend({
  args: {
    isMulti: true,
    value: [alice, bob],
  },
  play: async ({ canvas }) => {
    await expect(canvas.findByText('bob (#1:1)')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('alice (#2:1)')).resolves.toBeInTheDocument();
  },
});
