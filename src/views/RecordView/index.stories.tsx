import { HttpResponse } from 'msw';
import { expect } from 'storybook/test';

import preview, {
  hasFinishedLoading,
  http,
  view, ViewPreviewType,
} from '#.storybook/preview';

const meta = preview.type<ViewPreviewType>().meta({ ...view });

const mockUser = {
  name: 'jsmith',
  email: 'jsmith@bcgsc.ca',
  '@class': 'User',
  '@rid': '#1:1',
};

export const ViewAliasOf = meta.story({
  args: {
    path: '/view/AliasOf/65:69073',
    auth: { hasWriteAccess: true },
  },
  parameters: {
    msw: {
      handlers: [
        http.gkb.query(() => []),
        http.gkb.get('/api/aliasof/65:69073', () => HttpResponse.json({
          result: {
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
          },
        })),
      ],
    },
  },
});

export const ViewAliasOfOptionalFieldsExpanded = ViewAliasOf.extend({
  play: async ({ canvas, userEvent, step }) => {
    await hasFinishedLoading({ canvas, step });
    await userEvent.click(await canvas.findByText('Expand to see all optional fields'));
    await expect(canvas.findByText('@rid')).resolves.toBeInTheDocument();
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
  parameters: {
    msw: {
      handlers: [
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
      ],
    },
  },
});

export const ViewCategoryVariantOptionalFieldsExpanded = ViewCategoryVariant.extend({
  play: async ({ canvas, userEvent, step }) => {
    await hasFinishedLoading({ canvas, step });
    await userEvent.click(await canvas.findByText('Expand to see all optional fields'));
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
  parameters: {
    msw: {
      handlers: [
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
      ],
    },
  },
});

export const ViewPositionalVariantOptionalFieldsExpanded = ViewPositionalVariant.extend({
  play: async ({ canvas, userEvent, step }) => {
    await hasFinishedLoading({ canvas, step });
    await userEvent.click(await canvas.findByText('Expand to see all optional fields'));
    await expect(canvas.findByText('@rid')).resolves.toBeInTheDocument();
  },
});

export const ViewStatement = meta.story({
  args: {
    path: '/view/Statement/157:106045',
    auth: { hasWriteAccess: true },
  },
  parameters: {
    msw: {
      handlers: [
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
      ],
    },
  },
});

export const ViewStatementOptionalFieldsExpanded = ViewStatement.extend({
  play: async ({ canvas, userEvent, step }) => {
    await hasFinishedLoading({ canvas, step });
    await userEvent.click(await canvas.findByText('Expand to see all optional fields'));
    await expect(canvas.findByText('displayNameTemplate')).resolves.toBeInTheDocument();
  },
});

export const EditStatement = ViewStatement.extend({
  args: { path: '/edit/Statement/157:106045' },
});
