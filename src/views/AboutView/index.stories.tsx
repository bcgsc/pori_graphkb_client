import { expect } from 'storybook/test';

import preview, {
  hasFinishedLoading, http, view, ViewPreviewType,
} from '#.storybook/preview';

const meta = preview.type<ViewPreviewType>().meta({
  ...view,
  args: {
    auth: {
      user: {
        signedLicenseAt: null,
      },
    },
  },
  parameters: {
    ...view.parameters,
    msw: {
      handlers: [
        http.gkb.get('/api/version', () => []),
        http.gkb.get('/api/stats', ({ request }) => {
          const classList = new URL(request.url).searchParams.get('classList') ?? 'unknown';
          return ({
            [classList]: 10,
          });
        }),
        http.gkb.get('/api/license', () => ({
          enactedAt: new Date(2000, 0, 1).getTime(),
          content: [
            { label: 'Term A', content: 'You must provide free oranges for the team.' },
          ],
        })),
        http.gkb.query(() => []),
      ],
    },
  },
});

export const AboutTab = meta.story({
  args: {
    path: '/about',
  },
  play: async ({ canvas, step }) => {
    await hasFinishedLoading({ canvas, step });
    await expect(canvas.findByText(/DB/)).resolves.toBeInTheDocument();
  },
});

export const GettingStartedTab = meta.story({
  args: {
    path: '/about/getting-started',
  },
  play: async ({ canvas, step }) => {
    await hasFinishedLoading({ canvas, step });
    await expect(canvas.findByText('Welcome to GraphKB')).resolves.toBeInTheDocument();
  },
});

export const ClassesTab = meta.story({
  args: {
    path: '/about/classes',
  },
  play: async ({ canvas, step }) => {
    await hasFinishedLoading({ canvas, step });
    await expect(canvas.findByText('Forbidden')).resolves.toBeInTheDocument();
    await expect(canvas.queryByText('Record Classes')).not.toBeInTheDocument();
  },
});

export const ClassesTabSigned = ClassesTab.extend({
  args: {
    auth: {
      user: {
        signedLicenseAt: new Date(2020, 0, 1).getTime(),
      },
    },
  },
  play: async ({ canvas, step }) => {
    await hasFinishedLoading({ canvas, step });
    await expect(canvas.findByText('Record Classes')).resolves.toBeInTheDocument();
    await expect(canvas.queryByText('Forbidden')).not.toBeInTheDocument();
  },
});

export const NotationTab = meta.story({
  args: {
    path: '/about/notation',
  },
  play: async ({ canvas, step }) => {
    await hasFinishedLoading({ canvas, step });
    await expect(canvas.findByLabelText('notation')).resolves.toBeInTheDocument();
  },
});

export const NotationTabWithParsedValue = meta.story({
  args: {
    path: '/about/notation',
  },
  play: async ({ canvas, userEvent, step }) => {
    await hasFinishedLoading({ canvas, step });
    const input = await canvas.findByLabelText('notation');
    await userEvent.type(input, '(EWSR1,FLI1):fusion(e.1,e.2)');

    await expect(canvas.findAllByText('ExonicPosition')).resolves.toHaveLength(2);
  },
});

export const MatchingTab = meta.story({
  args: {
    path: '/about/matching',
  },
  play: async ({ canvas, step }) => {
    await hasFinishedLoading({ canvas, step });
    await expect(canvas.findByText('Forbidden')).resolves.toBeInTheDocument();
    await expect(canvas.queryByText('Visualize GraphKB (python) Matching')).not.toBeInTheDocument();
  },
});

export const MatchingTabSigned = MatchingTab.extend({
  args: {
    auth: {
      user: {
        signedLicenseAt: new Date(2020, 0, 1).getTime(),
      },
    },
  },
  play: async ({ canvas, step }) => {
    await hasFinishedLoading({ canvas, step });
    await expect(canvas.findByText('Visualize GraphKB (python) Matching')).resolves.toBeInTheDocument();
    await expect(canvas.queryByText('Forbidden')).not.toBeInTheDocument();
  },
});

export const TermsTab = meta.story({
  args: {
    path: '/about/terms',
  },
  play: async ({ step, canvas }) => {
    await hasFinishedLoading({ step, canvas });
    await expect(canvas.findByText('You must provide free oranges for the team.')).resolves.toBeInTheDocument();
    await expect(canvas.findByLabelText('I have read and understood the terms of use')).resolves.not.toBeChecked();
    await expect(canvas.findByText('Confirm')).resolves.toBeDisabled();
  },
});

TermsTab.test('checking box enables confirm button', async ({ canvas, userEvent }) => {
  await userEvent.click(await canvas.findByLabelText('I have read and understood the terms of use'));
  await expect(canvas.findByText('Confirm')).resolves.not.toBeDisabled();
});

export const TermsTabSigned = meta.story({
  args: {
    auth: {
      user: {
        signedLicenseAt: new Date(2020, 0, 1).getTime(),
      },
    },
    path: '/about/terms',
  },
  play: async ({ step, canvas }) => {
    await hasFinishedLoading({ step, canvas });
    await expect(canvas.findByText('You must provide free oranges for the team.')).resolves.toBeInTheDocument();
    await expect(canvas.findByLabelText('I have read and understood the terms of use')).resolves.toBeChecked();
    await expect(canvas.findByText('Confirm')).resolves.toBeDisabled();
  },
});
