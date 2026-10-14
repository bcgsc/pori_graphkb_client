import { HttpResponse } from 'msw';
import { expect, screen } from 'storybook/test';

import preview, {
  hasFinishedLoading,
  http,
  selectOption,
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

export const NewCategoryVariant = meta.story({
  args: {
    path: '/new/CategoryVariant',
  },
});

export const NewPositionalVariant = meta.story({
  args: {
    path: '/new/PositionalVariant',
  },
  parameters: {
    msw: {
      handlers: [http.gkb.query((body) => {
        if (body.target === 'Vocabulary') {
          return [
            { '@rid': '111:111', '@class': 'Vocabulary', displayName: 'fusion' },
            { '@rid': '111:222', '@class': 'Vocabulary', displayName: 'substitution' },
          ];
        }
        return [];
      })],
    },
  },
});

NewPositionalVariant.test('changing coordinate type affects position forms in later section', async ({ canvas, userEvent, step }) => {
  await hasFinishedLoading({ canvas, step });
  await expect(canvas.findByText('position (GenomicPosition)')).resolves.toBeInTheDocument();
  await selectOption(canvas, userEvent, /coordinate system/i, /^CdsPosition/i);
  await expect(canvas.findByText('position (CdsPosition)')).resolves.toBeInTheDocument();
  await expect(canvas.findByLabelText(/offset/i)).resolves.toBeInTheDocument();
});

NewPositionalVariant.test('Fusion shows 2nd breakpoint', async ({ canvas, userEvent, step }) => {
  await hasFinishedLoading({ canvas, step });
  await selectOption(canvas, userEvent, /^type/i, /^fusion/i);
  await expect(canvas.findByText('First Breakpoint')).resolves.toBeInTheDocument();
  await expect(canvas.findByText('Second Breakpoint')).resolves.toBeInTheDocument();
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
    await canvas.findByText(/Internal Server Error/, { exact: false });
  },
});

export const NewInvalidModel = meta.story({
  args: {
    path: '/new/Blargh',
  },
});
