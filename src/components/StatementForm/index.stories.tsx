import {
  expect, fn, screen, waitFor,
} from 'storybook/test';

import preview, {
  hasFinishedLoading, http, withAuth, withRouter, withSnackbar,
} from '#.storybook/preview';

import { FORM_VARIANT } from '../util';
import component from '.';

const meta = preview.meta({
  component,
  decorators: [withSnackbar, withAuth, withRouter],
  args: {
    title: 'blargh monkeys',
    onSubmit: fn(),
    value: {},
  },
  parameters: {
    msw: {
      handlers: [
        http.gkb.query((payload) => {
          // to prevent other records causing validation error when running `checkLogicalStatement`
          if (payload.queryType === 'similarTo') {
            return [];
          }

          return [
            {
              '@rid': '11:11',
              displayName: 'anything',
            },
            {
              '@rid': '12:23',
              displayName: 'anything',
            },
            {
              '@rid': '20:20',
              displayName: 'anything',
            },
            {
              '@rid': '90:32',
              displayName: 'anything',
            },
          ];
        }),
        http.gkb.post('/api/statements', (body) => body),
      ],
    },
  },
});

export const Editing = meta.story({
  args: {
    variant: FORM_VARIANT.EDIT,
  },
  play: async ({ canvas, step }) => {
    await hasFinishedLoading({ canvas, step });
    await expect(canvas.findByText('Add Review')).resolves.toBeInTheDocument();
  },
});

export const New = meta.story({
  args: {
    variant: FORM_VARIANT.NEW,
    auth: { hasWriteAccess: true, user: { '@rid': '23:9', name: 'name', groups: [] } },
  },
  play: hasFinishedLoading,
});

New.test('on submit sets reviewStatus as initial and adds empty review if left blank', async ({ canvas, userEvent, args }) => {
  async function selectFromAutocomplete(label: RegExp, value: string) {
    const input = await canvas.findByLabelText(label);
    await userEvent.type(input, value[0]);
    const option = await screen.findByText(value);
    await userEvent.click(option);
  }

  await selectFromAutocomplete(/^conditions/, 'anything (11:11)');
  await selectFromAutocomplete(/^evidence /, 'anything (12:23)');
  await selectFromAutocomplete(/^relevance/, 'anything (90:32)');
  await selectFromAutocomplete(/^subject/, 'anything (20:20)');
  const submitBtn = canvas.getByText('SUBMIT');
  expect(submitBtn).toBeEnabled();

  await userEvent.click(submitBtn);

  const expectedPayload = {
    '@class': 'Statement',
    conditions: ['11:11'],
    evidence: ['12:23'],
    relevance: '90:32',
    subject: '20:20',
    reviewStatus: 'initial',
    reviews: [{
      status: 'initial',
      comment: '',
      createdBy: '23:9',
    }],
  };
  await waitFor(() => {
    expect(args.onSubmit).toHaveBeenCalledWith(expectedPayload);
  });
});
