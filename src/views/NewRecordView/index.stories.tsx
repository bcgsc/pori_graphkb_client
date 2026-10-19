import type { StoryObj } from '@storybook/react-vite';
import { HttpResponse } from 'msw';
import {
  expect, screen, waitFor,
} from 'storybook/test';

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
    path: '/new/ontology',
  },
});

export const NewFeature = meta.story({
  args: {
    path: '/new/Feature',
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

const VOCABULARY = [
  { '@rid': '111:111', '@class': 'Vocabulary', displayName: 'fusion' },
  { '@rid': '111:222', '@class': 'Vocabulary', displayName: 'substitution' },
  { '@rid': '111:333', '@class': 'Vocabulary', displayName: 'deletion' },
];

const FEATURES = [
  { '@rid': '21:1', '@class': 'Feature', displayName: 'KRAS' },
  { '@rid': '21:2', '@class': 'Feature', displayName: 'NTRK1' },
];

const variantQuery = http.gkb.query((body) => {
  if (body.target === 'Vocabulary') {
    return VOCABULARY;
  }

  if (body.target === 'Feature') {
    return FEATURES;
  }
  return [];
});

const linkedRecord = (rid: unknown) => [...VOCABULARY, ...FEATURES].find((record) => record['@rid'] === rid) ?? rid;

/**
 * Mocks creating a record and then fetching it (ex. after the redirect to its view).
 * The fetched record is built from what was posted, with links resolved to the mock records.
 */
function mockCreate(route: `/api/${string}`, rid: string) {
  let created: Record<string, unknown> | undefined;

  return [
    http.gkb.post(route, (body) => {
      created = { ...body, '@rid': rid };
      return { result: created };
    }),
    http.gkb.get(`${route}/:rid`, () => {
      if (!created) {
        return HttpResponse.json({ message: 'record has not been created', name: 'NoRecordFoundError' }, { status: 404 });
      }
      return HttpResponse.json({
        result: Object.fromEntries(Object.entries(created).map(([key, value]) => [key, linkedRecord(value)])),
      });
    }),
  ];
}

type PlayContext = Parameters<NonNullable<StoryObj['play']>>[0];

const getPositions = (canvas: PlayContext['canvas']) => canvas.getAllByLabelText<HTMLInputElement>(/^pos\b/i);

async function enterText({ userEvent }: Pick<PlayContext, 'userEvent'>, input: HTMLElement, text: string) {
  await userEvent.click(input);
  await userEvent.paste(text);
}

async function selectRecord(context: Pick<PlayContext, 'userEvent'>, input: HTMLElement, search: string, option: string) {
  await enterText(context, input, search);
  await context.userEvent.click(await screen.findByText(option));
}

/** submits the form and waits for the redirect to the view of the created variant */
async function submitAndWaitForView(context: Pick<PlayContext, 'canvas' | 'userEvent' | 'step'>) {
  const { canvas, userEvent } = context;
  const submitBtn = canvas.getByText('SUBMIT');
  await waitFor(() => expect(submitBtn).toBeEnabled());
  await userEvent.click(submitBtn);

  await expect(canvas.findByText('PositionalVariant #50:1')).resolves.toBeInTheDocument();
  await hasFinishedLoading(context);
}

export const NewPositionalVariant = meta.story({
  args: {
    path: '/new/PositionalVariant',
  },
  parameters: {
    msw: {
      handlers: [variantQuery, ...mockCreate('/api/positionalvariants', '#50:1')],
    },
  },
});

export const NewPositionalVariantFusion = NewPositionalVariant.extend({
  play: async (context) => {
    const { canvas, userEvent, step } = context;
    await hasFinishedLoading({ canvas, step });
    await selectOption(canvas, userEvent, /^type/i, /^fusion/i);
    await expect(canvas.findByText('First Breakpoint')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Second Breakpoint')).resolves.toBeInTheDocument();

    const [reference1, reference2] = await canvas.findAllByLabelText(/^reference/i);
    await selectRecord(context, reference1, 'K', 'KRAS (21:1)');
    await selectRecord(context, reference2, 'N', 'NTRK1 (21:2)');

    // mark both breakpoints as ranges so the end positions are shown
    const uncertain = await canvas.findAllByRole('checkbox', { name: /uncertain position/i });
    expect(uncertain).toHaveLength(2);
    await userEvent.click(uncertain[0]);
    await userEvent.click(uncertain[1]);

    // in order: break1Start, break1End, break2Start, break2End
    await waitFor(() => expect(getPositions(canvas)).toHaveLength(4));
    const positions = getPositions(canvas);
    await enterText(context, positions[0], '10');
    await enterText(context, positions[1], '15');
    await enterText(context, positions[2], '20');
    await enterText(context, positions[3], '25');
    const submitBtn = canvas.getByText('SUBMIT');
    await waitFor(() => expect(submitBtn).toBeEnabled());
  },
});

NewPositionalVariantFusion.test('submitting the filled out form shows the created variant with the entered values', async (context) => {
  const { canvas } = context;
  await submitAndWaitForView(context);

  await expect(canvas.findByText('fusion (111:111)')).resolves.toBeInTheDocument();
  await expect(canvas.findByText('KRAS (21:1)')).resolves.toBeInTheDocument();
  await expect(canvas.findByText('NTRK1 (21:2)')).resolves.toBeInTheDocument();
  await waitFor(() => {
    expect(getPositions(canvas).map((input) => input.value)).toEqual(['10', '15', '20', '25']);
  });
});

export const NewPositionalVariantSubstitution = NewPositionalVariant.extend({
  play: async ({ canvas, userEvent, step }) => {
    await hasFinishedLoading({ canvas, step });
    await selectOption(canvas, userEvent, /^type/i, /^substitution/i);
    await expect(canvas.findByText('Breakpoint')).resolves.toBeInTheDocument();
    await expect(canvas.queryByText('Second Breakpoint')).not.toBeInTheDocument();
  },
});

NewPositionalVariantSubstitution.test('changing coordinate type affects position forms in later section', async ({ canvas, userEvent, step }) => {
  await hasFinishedLoading({ canvas, step });
  await expect(canvas.findByText('position (GenomicPosition)')).resolves.toBeInTheDocument();
  await selectOption(canvas, userEvent, /coordinate system/i, /^CdsPosition/i);
  await expect(canvas.findByText('position (CdsPosition)')).resolves.toBeInTheDocument();
  await expect(canvas.findByLabelText(/offset/i)).resolves.toBeInTheDocument();
});

export const NewPositionalVariantOther = NewPositionalVariant.extend({
  play: async (context) => {
    const { canvas, userEvent, step } = context;
    await hasFinishedLoading({ canvas, step });
    await selectOption(canvas, userEvent, /^type/i, /^deletion/i);
    await expect(canvas.findByText('First Breakpoint')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Second Breakpoint')).resolves.toBeInTheDocument();

    const [reference1] = await canvas.findAllByLabelText(/^reference/i);
    await selectRecord(context, reference1, 'K', 'KRAS (21:1)');

    // in order: break1Start, break2Start
    await waitFor(() => expect(getPositions(canvas)).toHaveLength(2));
    const positions = getPositions(canvas);
    await enterText(context, positions[0], '10');
    await enterText(context, positions[1], '15');

    const submitBtn = canvas.getByText('SUBMIT');
    await waitFor(() => expect(submitBtn).toBeEnabled());
  },
});

NewPositionalVariantOther.test('submitting the filled out form shows the created variant with the entered values', async (context) => {
  const { canvas } = context;

  await submitAndWaitForView(context);

  await expect(canvas.findByText('deletion (111:333)')).resolves.toBeInTheDocument();
  await expect(canvas.findByText('KRAS (21:1)')).resolves.toBeInTheDocument();
  await waitFor(() => {
    expect(getPositions(canvas).map((input) => input.value)).toEqual(['10', '15']);
  });
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
