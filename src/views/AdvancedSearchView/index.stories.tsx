import { expect, fn, waitFor } from 'storybook/test';

import { encodeJSON } from '@/components/util';
import preview, {
  hasFinishedLoading,
  http, selectOption, view, ViewPreviewType,
} from '#.storybook/preview';

const meta = preview.type<ViewPreviewType>().meta({ ...view });

export const Default = meta.story({
  args: {
    path: '/query-advanced',
    onLocationChange: fn(),
  },
  beforeEach({ msw }) {
    msw.use(http.gkb.query(() => [
      {
        '@class': 'Therapy', '@rid': '#111:111', count: 2, name: 'immunotherapy', source: { displayName: 'source 1234' },
      },
    ]));
  },
});

export const WithFilterGroup = Default.extend({
  play: async ({ canvas, userEvent, step }) => {
    await hasFinishedLoading({ canvas, step });
    await selectOption(canvas, userEvent, 'relevance', /^immunotherapy/);
    const addBtn = await canvas.findByText(/add to selected group/i);
    await waitFor(() => expect(addBtn).toBeEnabled());
    await userEvent.click(addBtn);
    await hasFinishedLoading({ canvas, step });
  },
});

WithFilterGroup.test('clicking search navigates to results page', async ({ canvas, args, userEvent }) => {
  const search = await canvas.findByText(/search/i);
  await waitFor(async () => expect(search).toBeEnabled());
  await userEvent.click(search);
  await waitFor(() => expect(args.onLocationChange).toHaveBeenLastCalledWith(
    {
      pathname: '/data/table',
      search: `?${new URLSearchParams({
        q: encodeJSON({ target: 'Statement', filters: { operator: 'IN', relevance: ['#111:111'] } }),
      })}`,
    },
  ), { timeout: 5000 });
});

export const WithQuery = Default.extend({
  args: {
    path: `/query-advanced?${new URLSearchParams({ q: encodeJSON({ target: 'Statement', filters: { operator: 'IN', relevance: ['#111:111'] } }) })}`,
  },
  play: async ({ canvas, step }) => {
    await hasFinishedLoading({ canvas, step });
    await expect(canvas.findByText(/relevance IN \('immunotherapy \(#111:111\)'\)/i)).resolves.toBeInTheDocument();
  },
});

const manyFiltersQuery = {
  target: 'Statement',
  filters: {
    OR: [
      { operator: 'IN', relevance: ['#111:111'] },
      {
        AND: [
          { operator: '=', reviewStatus: 'passed' },
          {
            operator: 'IN',
            subject: {
              queryType: 'similarTo',
              treeEdges: ['ElementOf'],
              target: {
                target: 'Feature',
                operator: 'CONTAINSTEXT',
                keyword: 'xyz',
                queryType: 'keyword',
              },
            },
          },
        ],
      },
    ],
  },
};

export const WithQueryManyFilters = WithQuery.extend({
  args: {
    path: `/query-advanced?${new URLSearchParams({
      q: encodeJSON(manyFiltersQuery),
    })}`,
  },
});

WithQueryManyFilters.test('clicking search omits in empty filter groups', async ({
  canvas, args, step, userEvent,
}) => {
  await hasFinishedLoading({ canvas, step });
  const addBtn = await canvas.findByText(/add new filter group/i);
  await waitFor(() => expect(addBtn).toBeEnabled());
  await userEvent.click(addBtn);
  await expect(canvas.findByText('3')).resolves.toBeInTheDocument();
  const search = await canvas.findByText(/search/i);
  await waitFor(async () => expect(search).toBeEnabled());
  await userEvent.click(search);
  await waitFor(() => expect(args.onLocationChange).toHaveBeenLastCalledWith(
    {
      pathname: '/data/table',
      search: `?${new URLSearchParams({
        q: encodeJSON(manyFiltersQuery),
      })}`,
    },
  ), { timeout: 5000 });
});

WithQueryManyFilters.test('removing a filter keeps group', async ({
  canvas, step, userEvent, args,
}) => {
  await hasFinishedLoading({ canvas, step });
  await expect(canvas.findByText('2')).resolves.toBeInTheDocument();
  await userEvent.type(await canvas.findByText(/relevance IN \('immunotherapy \(#111:111\)'\)/i), '{Backspace}');
  await expect(canvas.findByLabelText(/remove filter group 1/i)).resolves.toBeInTheDocument();
  await expect(canvas.findByText('2')).resolves.toBeInTheDocument();
  await waitFor(() => expect(canvas.queryByText(/relevance IN \('immunotherapy \(#111:111\)'\)/i)).not.toBeInTheDocument());
  await waitFor(() => expect(args.onLocationChange).toHaveBeenLastCalledWith(
    {
      pathname: '/query-advanced',
      search: `?${new URLSearchParams({
        q: encodeJSON({
          target: 'Statement',
          filters: {
            OR: [
              { AND: [] },
              manyFiltersQuery.filters.OR[1],
            ],
          },
        }),
      })}`,
    },
  ), { timeout: 5000 });
});

WithQueryManyFilters.test('removing a filter group removes entire group', async ({
  canvas, step, userEvent, args,
}) => {
  await hasFinishedLoading({ canvas, step });
  await expect(canvas.findByText('2')).resolves.toBeInTheDocument();
  await userEvent.click(await canvas.findByLabelText(/remove filter group 1/i));
  await waitFor(() => expect(canvas.queryByLabelText(/remove filter group 1/i)).not.toBeInTheDocument());
  await waitFor(() => expect(canvas.queryByText('2')).not.toBeInTheDocument());
  await waitFor(() => expect(canvas.queryByText(/relevance IN \('immunotherapy \(#111:111\)'\)/i)).not.toBeInTheDocument());
  await waitFor(() => expect(args.onLocationChange).toHaveBeenLastCalledWith(
    {
      pathname: '/query-advanced',
      search: `?${new URLSearchParams({
        q: encodeJSON({
          target: 'Statement',
          filters: manyFiltersQuery.filters.OR[1],
        }),
      })}`,
    },
  ), { timeout: 5000 });
});

export const WithInvalidQuery = Default.extend({
  args: {
    path: `/query-advanced?${new URLSearchParams({ q: encodeJSON({ target: ['#111:111'] }) })}`,
  },
  play: async ({ canvas, step }) => {
    await hasFinishedLoading({ canvas, step });
    await expect(canvas.findByText(/Invalid or unsupported query body omitted/)).resolves.toBeInTheDocument();
  },
});

export const WithUnsupportedQuery = Default.extend({
  args: {
    path: `/query-advanced?${new URLSearchParams({
      q: encodeJSON({ queryType: 'keyword', target: 'PositionalVariant', keyword: 'BRAF' }),
    })}`,
  },
  play: async ({ canvas, step }) => {
    await hasFinishedLoading({ canvas, step });
    await expect(canvas.findByText(/keyword query type is not supported/i)).resolves.toBeInTheDocument();
  },
});
