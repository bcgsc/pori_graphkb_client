import { HttpResponse } from 'msw';
import {
  expect, screen, waitFor, within,
} from 'storybook/test';

import preview, {
  hasFinishedLoading,
  http,
  selectOption,
  view, ViewPreviewType,
} from '#.storybook/preview';

const meta = preview.type<ViewPreviewType>().meta({ ...view });

const mockUser = {
  name: 'jsmith',
  email: 'jsmith@bcgsc.ca',
  '@class': 'User',
  '@rid': '#1:1',
};

const aliasOfRecord = {
  createdAt: 1774995410545,
  in: {
    displayName: 'amsa/5-aza-dcyd [c10098]',
    '@rid': '#124:31764',
    '@class': 'Therapy',
  },
  createdBy: mockUser,
  source: {
    displayName: 'NCIt',
    '@rid': '#40:3',
    '@class': 'Source',
  },
  out: {
    displayName: 'amsa/dac [c10098]',
    '@rid': '#121:23',
    '@class': 'Therapy',
  },
  '@rid': '#65:69073',
  '@class': 'AliasOf',
};

export const ViewAliasOf = meta.story({
  args: {
    path: '/view/AliasOf/65:69073',
    auth: { hasWriteAccess: true },
  },
  beforeEach({ msw }) {
    msw.use(http.gkb.query((body) => {
      if (Array.isArray(body.target) && body.target[0] === '#65:69073') {
        return [aliasOfRecord];
      }
      return [];
    }), http.gkb.get('/api/aliasof/65:69073', () => HttpResponse.json({
      result: aliasOfRecord,
    })));
  },
});

ViewAliasOf.test('clicking graph button opens graph view', async ({ canvas, userEvent }) => {
  await userEvent.click(await canvas.findByText(/graph/i));
  await expect(await canvas.findByText(/aliasof/i)).toBeInTheDocument();
  // one of the buttons that's only visible in graph view
  await expect(await canvas.findByLabelText(/rerun layout/i)).toBeInTheDocument();
});

export const ViewAliasOfOptionalFieldsExpanded = ViewAliasOf.extend({
  play: async ({ canvas, userEvent, step }) => {
    await hasFinishedLoading({ canvas, step });
    await userEvent.click(await canvas.findByText('Expand to see additional fields'));
    await expect(canvas.findByText('@rid')).resolves.toBeInTheDocument();
  },
});

export const ViewAliasOfNotFound = meta.story({
  args: {
    path: '/view/AliasOf/65:69073',
    auth: { hasWriteAccess: true },
  },
  beforeEach({ msw }) {
    msw.use(
      http.gkb.query(() => []),
      http.gkb.get('/api/aliasof/:rid', () => HttpResponse.json({ message: 'query expected 1 records but only found 0', name: 'NoRecordFoundError' }, { status: 404 })),
    );
  },
});

export const EditAliasOf = ViewAliasOf.extend({
  args: { path: '/edit/AliasOf/65:69073' },
});

export const ViewCategoryVariant = meta.story({
  args: {
    path: '/view/CategoryVariant/161:1484',
    auth: { hasWriteAccess: true },
  },
  beforeEach({ msw }) {
    msw.use(
      http.gkb.query(() => []),
      http.gkb.get('/api/categoryvariants/161:1484', () => HttpResponse.json({
        result: {
          '@class': 'CategoryVariant',
          '@rid': '#161:1484',
          createdAt: 1775765271881,
          updatedBy: mockUser,
          germline: false,
          createdBy: mockUser,
          displayName: 'NOTCH4 increased RNA expression',
          reference1: {
            displayName: 'NOTCH4',
            '@class': 'Feature',
            '@rid': '#128:91665',
          },
          type: {
            displayName: 'increased RNA expression',
            '@class': 'Vocabulary',
            '@rid': '#148:16',
          },
          updatedAt: 1775765271881,
          reference2: null,
        },
      })),
    );
  },
});

export const ViewCategoryVariantOptionalFieldsExpanded = ViewCategoryVariant.extend({
  play: async ({ canvas, userEvent, step }) => {
    await hasFinishedLoading({ canvas, step });
    await userEvent.click(await canvas.findByText('Expand to see additional fields'));
    await expect(canvas.findByText('@rid')).resolves.toBeInTheDocument();
  },
});

export const EditCategoryVariant = ViewCategoryVariant.extend({
  args: { path: '/edit/CategoryVariant/161:1484' },
});

export const ViewPositionalVariant = meta.story({
  args: {
    path: '/view/PositionalVariant/157:106045',
    auth: { hasWriteAccess: true },
  },
  beforeEach({ msw }) {
    msw.use(
      http.gkb.query(() => []),
      http.gkb.get('/api/positionalvariants/157:106045', () => HttpResponse.json({
        result: {
          '@class': 'PositionalVariant',
          '@rid': '#157:106045',
          createdAt: 1775068561621,
          break1Start: {
            pos: 411,
            refAA: 'D',
            '@class': 'ProteinPosition',
          },
          updatedBy: mockUser,
          createdBy: mockUser,
          displayName: 'PPP2R2A:p.D411N',
          reference1: {
            displayName: 'PPP2R2A',
            '@class': 'Feature',
            '@rid': '#128:89338',
          },
          untemplatedSeq: 'N',
          refSeq: 'D',
          type: {
            displayName: 'missense',
            '@class': 'Vocabulary',
            '@rid': '#145:31',
          },
          break1Repr: 'p.D411',
          updatedAt: 1775068561621,
          reference2: null,
        },
      })),
    );
  },
});

export const ViewPositionalVariantOptionalFieldsExpanded = ViewPositionalVariant.extend({
  play: async ({ canvas, userEvent, step }) => {
    await hasFinishedLoading({ canvas, step });
    await userEvent.click(await canvas.findByText('Expand to see additional fields'));
    await expect(canvas.findByText('@rid')).resolves.toBeInTheDocument();
  },
});

export const EditPositionalVariant = ViewPositionalVariant.extend({
  args: { path: '/edit/PositionalVariant/157:106045' },
});

export const ViewStatement = meta.story({
  args: {
    path: '/view/Statement/157:106045',
    auth: { hasWriteAccess: true },
  },
  beforeEach({ msw }) {
    msw.use(
      http.gkb.query(() => []),
      http.gkb.get('/api/statements/157:106045', () => HttpResponse.json({
        result: {
          updatedBy: mockUser,
          evidence: [
            {
              displayName: 'FDA approves pembrolizumab for adults and children with TMB-H solid tumors',
              '@rid': '#114:57',
              '@class': 'CuratedContent',
            },
          ],
          source: { '@rid': '#111:777', name: 'civic' },
          sourceId: '12345',
          subject: {
            displayName: 'pembrolizumab [DB09037]',
            '@rid': '#122:30774',
            '@class': 'Therapy',
          },
          displayNameTemplate: '{conditions:variant} is associated with {relevance} to {subject} in {conditions:disease} ({evidence}) ({evidenceLevel})',
          history: '#153:14996',
          relevance: {
            displayName: 'sensitivity',
            '@rid': '#148:34',
            '@class': 'Vocabulary',
          },
          createdAt: 1659547281858,
          reviews: [
            {
              createdAt: 1659547281859,
              createdBy: mockUser['@rid'],
              comment: '',
              status: 'initial',
              '@class': 'StatementReview',
              '@rid': null,
            },
          ],
          createdBy: mockUser,
          comment: 'for the treatment of adult and pediatric patients with unresectable or metastatic tumor mutational burden-high (tmb-h) [≥10 mutations/megabase (mut/mb)] solid tumors, as determined by an fda-approved test, that have progressed following prior treatment and who have no satisfactory alternative treatment options.',
          reviewStatus: 'passed',
          conditions: [
            {
              displayName: 'pembrolizumab [DB09037]',
              '@rid': '#122:30774',
              '@class': 'Therapy',
            },
            {
              displayName: 'all solid tumors',
              '@rid': '#133:21363',
              '@class': 'Disease',
            },
            {
              displayName: 'high mutation burden high signature',
              '@rid': '#161:920',
              '@class': 'CategoryVariant',
            },
          ],
          evidenceLevel: [
            {
              displayName: 'IPR-A',
              '@rid': '#108:30',
              '@class': 'EvidenceLevel',
            },
          ],
          updatedAt: 1700759163483,
          '@rid': '#153:14338',
          '@class': 'Statement',
        },
      })),
    );
  },
});

export const ViewStatementNotFound = meta.story({
  args: {
    path: '/view/Statement/157:106045',
    auth: { hasWriteAccess: true },
  },
  beforeEach({ msw }) {
    msw.use(
      http.gkb.query(() => []),
      http.gkb.get('/api/statements/:rid', () => HttpResponse.json({ message: 'query expected 1 records but only found 0', name: 'NoRecordFoundError' }, { status: 404 })),
    );
  },
});

export const ViewStatementOptionalFieldsExpanded = ViewStatement.extend({
  play: async ({ canvas, userEvent, step }) => {
    await hasFinishedLoading({ canvas, step });
    await userEvent.click(await canvas.findByText('Expand to see additional fields'));
    await expect(canvas.findByText('displayNameTemplate')).resolves.toBeInTheDocument();
  },
});

export const EditStatement = ViewStatement.extend({
  args: { path: '/edit/Statement/157:106045' },
});

EditStatement.test('can add review', async ({ canvas, userEvent }) => {
  await userEvent.click(await canvas.findByText(/add review/i));
  const dialog = await screen.findByRole('dialog');
  await waitFor(() => expect(dialog).toBeVisible());
  // try clicking add and show does not submit without status
  await userEvent.click(await within(dialog).findByText(/add review/i));
  await expect(await within(dialog).findByText(/Required Value/i)).toBeInTheDocument();
  await expect(await within(dialog).findByText(/add review/i)).toBeDisabled();
  await userEvent.type(await within(dialog).findByLabelText(/comment/i), 'test comment');
  await selectOption(within(dialog), userEvent, /status/i, /passed/i);
  await userEvent.click(await within(dialog).findByText(/add review/i));
  // overall status and chip
  await expect(await canvas.findByLabelText(/reviewstatus/i)).toHaveTextContent('passed');
  await userEvent.click(await canvas.findByText(/bmonkeys/i));
  // chip popup
  await expect(await screen.findByText(/statement review/i)).toBeInTheDocument();
  await expect(await screen.findByText(/test comment/i)).toBeInTheDocument();
  await expect(await screen.findByText(/created by bmonkeys/i)).toBeInTheDocument();
});

export const EditStatementErrorDeleting = ViewStatement.extend({
  args: { path: '/edit/Statement/157:106045' },
  beforeEach({ msw }) {
    msw.use(
      http.gkb.delete('/api/statements/:rid', () => HttpResponse.json({ message: 'Insufficient permissions to delete record.' }, { status: 403 })),
    );
  },
  play: async ({ canvas, userEvent, step }) => {
    await hasFinishedLoading({ canvas, step });
    await userEvent.click(await canvas.findByText(/delete record/i));
    await userEvent.click(await screen.findByText(/confirm/i));
    await canvas.findByText(/Insufficient permissions to delete record./, { exact: false });
  },
});

const featureRecord = {
  '@class': 'Feature',
  '@rid': '#128:30382',
  displayName: 'DNMT3A',
  in_ElementOf: [
    {
      out: {
        displayName: 'NR_135490',
        '@class': 'Feature',
        '@rid': '#127:63119',
      },
      '@class': 'ElementOf',
      '@rid': '#83:71936',
    },
  ],
  name: 'dnmt3a',
  in_CrossReferenceOf: [
    {
      in: '#128:30382',
      out: {
        displayName: 'DNMT3A',
        '@class': 'Feature',
        '@rid': '#125:112189',
      },
      '@class': 'CrossReferenceOf',
      '@rid': '#73:3842',
    },
  ],
  longName: 'DNA methyltransferase 3 alpha',
  updatedAt: 1725084719833,
};

export const ViewFeatureWithRelated = meta.story({
  args: { path: '/view/Feature/128:30382' },
  beforeEach({ msw }) {
    msw.use(http.gkb.query((body) => {
      if (body.target === 'Statement') {
        return [
          {
            '@class': 'Statement',
            '@rid': '#153:5652',
            conditions: [
              {
                displayName: 'acute myeloid leukemia [DOID:9119]',
              },
              {
                displayName: 'DNMT3A',
              },
              {
                displayName: 'DNMT3A:p.R882C',
              },
            ],
            evidence: [
              {
                displayName: 'pmid:21518476',
              },
            ],
            relevance: {
              displayName: 'loss of function',
            },
            subject: {
              displayName: 'DNMT3A',
            },
            reviewStatus: 'passed',
          },
        ];
      }
      if (body.target === 'Variant') {
        return [
          {
            '@class': 'PositionalVariant',
            '@rid': '#157:466',
            displayName: 'DNMT3A:p.R882G',
          },
          {
            '@class': 'PositionalVariant',
            '@rid': '#157:489',
            displayName: 'DNMT3A:p.S714X',
          },
          {
            '@class': 'PositionalVariant',
            '@rid': '#160:5446',
            displayName: 'DNMT3A:p.R882H',
          },
        ];
      }
      if (Array.isArray(body.target) && body.target[0] === '#128:30382') {
        return [featureRecord];
      }
      return [];
    }), http.gkb.get('/api/features/128:30382', () => HttpResponse.json({
      result: featureRecord,
    })));
  },
});
