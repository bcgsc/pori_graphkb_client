import { HttpResponse } from 'msw';
import {
  expect, fn, screen, waitFor,
} from 'storybook/test';

import { encodeJSON } from '@/components/util';
import preview, {
  hasFinishedLoading, http, view, ViewPreviewType,
} from '#.storybook/preview';

const meta = preview.type<ViewPreviewType>().meta({ ...view });

export const NoRows = meta.story({
  args: {
    path: '/data/table',
  },
  play: async ({ canvas, step }) => {
    await hasFinishedLoading({ canvas, step });
    await expect(await canvas.findByText(/preview/i)).toBeInTheDocument();
  },
});

export const WithRows = NoRows.extend({
  args: {
    path: `/data/table?${new URLSearchParams({ q: encodeJSON({ target: 'Therapy' }) })}`,
  },
  beforeEach({ msw }) {
    msw.use(http.gkb.query(() => [
      {
        '@class': 'Therapy', '@rid': '#111:111', count: 2, name: 'immunotherapy', source: { displayName: 'source 1234' },
      },
      {
        '@class': 'Therapy', '@rid': '#111:222', count: 2, name: 'immunological therapy',
      },
    ]));
  },
});

export const WithError = WithRows.extend({
  beforeEach({ msw }) {
    msw.use(
      http.gkb.query(() => HttpResponse.json({ message: 'Bad Request' }, { status: 400 })),
    );
  },
});

export const WithDetailsOpen = WithRows.extend({
  play: async ({ canvas, step, userEvent }) => {
    await hasFinishedLoading({ canvas, step });
    await userEvent.click(await canvas.findByText('source 1234'));
    await expect(await canvas.findByText('immunotherapy (#111:111)')).toBeInTheDocument();
    // the drawer title renders from row data before the details query (and footer spinner) finishes
    await hasFinishedLoading({ canvas, step });
  },
});

export const WithDetailsOpenError = WithRows.extend({
  beforeEach({ msw }) {
    msw.use(http.gkb.query((body) => {
      if (Array.isArray(body.target) && body.target.length === 1) {
        return HttpResponse.json({ message: 'Bad Request' }, { status: 400 });
      }
      return [
        {
          '@class': 'Therapy', '@rid': '#111:111', count: 2, name: 'immunotherapy', source: { displayName: 'source 1234' },
        },
        {
          '@class': 'Therapy', '@rid': '#111:222', count: 2, name: 'immunological therapy',
        },
      ];
    }));
  },
  play: async ({ canvas, context }) => {
    await WithDetailsOpen.play(context);
    await expect(await canvas.findByText('An error occurred loading the details.', { exact: false })).toBeInTheDocument();
  },
});

export const WithQueryForModifySearch = WithRows.extend({
  args: {
    path: `/data/table?${new URLSearchParams({
      q: encodeJSON({
        target: 'Therapy',
        neighbors: 2,
        limit: 100,
      }),
    })}`,
    onLocationChange: fn(),
  },
  parameters: { snapshot: false },
});

WithQueryForModifySearch.test('Modify Search opens the resolved query', async ({
  canvas, args, userEvent, step,
}) => {
  await hasFinishedLoading({ canvas, step });
  await userEvent.click(canvas.getByRole('button', { name: 'click here for table and export options' }));
  await userEvent.click(await screen.findByText('Modify Search'));
  await waitFor(() => expect(args.onLocationChange).toHaveBeenLastCalledWith({
    pathname: '/query-advanced',
    search: `?${new URLSearchParams({
      q: encodeJSON({
        target: 'Therapy',
        neighbors: 2,
        limit: 100,
      }),
    })}`,
  }), { timeout: 5000 });
});
