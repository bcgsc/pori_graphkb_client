import { expect, waitFor } from 'storybook/test';

import preview, {
  hasFinishedLoading,
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
