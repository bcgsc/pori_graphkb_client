import { HttpResponse } from 'msw';
import {
  expect, screen, waitFor, waitForElementToBeRemoved,
} from 'storybook/test';

import preview, {
  hasFinishedLoading,
  http,
  view, ViewPreviewType,
} from '#.storybook/preview';

const meta = preview.type<ViewPreviewType>().meta({ ...view });

export const NewSource = meta.story({
  args: {
    path: '/new/source',
  },
});

export const NewSourceAsAdmin = meta.story({
  args: {
    path: '/new/source',
    auth: { isAdmin: true },
  },
  play: async ({ step, canvas }) => {
    await hasFinishedLoading({ step, canvas });
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: /submit/i })).toBeDisabled();
    });
  },
});

export const NewOntology = meta.story({
  args: {
    path: '/new/e',
  },
});

export const NewVariant = meta.story({
  args: {
    path: '/new/variant',
  },
});

export const NewStatement = meta.story({
  args: {
    path: '/new/statement',
  },
});

export const NewStatementOptionalFieldsExpanded = NewStatement.extend({
  play: async ({ canvas, userEvent, step }) => {
    await hasFinishedLoading({ canvas, step });
    await userEvent.click(await canvas.findByText('Expand to see all optional fields'));
    await expect(canvas.findByText('displayNameTemplate')).resolves.toBeInTheDocument();
  },
});

export const NewRelationship = meta.story({
  args: {
    path: '/new/e',
  },
});

export const NewRelationshipAliasOf = meta.story({
  args: {
    path: '/new/AliasOf',
  },
});

export const NewRelationshipAliasOfErrorAfterSubmit = meta.story({
  args: {
    path: '/new/AliasOf',
  },
  parameters: {
    msw: {
      handlers: [
        http.gkb.query(() => [{ '@rid': '111:111', '@class': 'Ontology' }, { '@rid': '222:222', '@class': 'Ontology' }]),
        http.gkb.post('/api/aliasof', () => HttpResponse.json({ message: 'Failed unique constraint.' }, { status: 500 })),
      ],
    },
  },
  play: async ({ canvas, step, userEvent }) => {
    await hasFinishedLoading({ canvas, step });
    await userEvent.type(canvas.getByLabelText(/source record \(out\)/i), '111');
    await userEvent.click(await screen.findByText('Ontology (111:111)'));
    await userEvent.type(canvas.getByLabelText(/target record \(in\)/i), '222');
    await userEvent.click(await screen.findByText('Ontology (222:222)'));
    await userEvent.click(canvas.getByText(/submit/i));
    const snackbar = await canvas.findByText(/Error \(Error\) in creating the record/);
    await canvas.findByText(/Internal Server Error/, { exact: false });
    await waitForElementToBeRemoved(snackbar, { timeout: 10000 });
  },
});
