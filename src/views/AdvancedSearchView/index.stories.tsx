import { expect, fn, waitFor } from 'storybook/test';

import preview, {
  http, selectOption, view, ViewPreviewType,
} from '#.storybook/preview';

const meta = preview.type<ViewPreviewType>().meta({ ...view });

export const Default = meta.story({
  args: {
    path: '/query-advanced',
  },
  parameters: {
    msw: {
      handlers: [
        http.gkb.query(() => [
          {
            '@class': 'Therapy', '@rid': '#111:111', count: 2, name: 'immunotherapy', source: { displayName: 'source 1234' },
          },
        ]),
      ],
    },
  },
});

export const WithFilterGroup = Default.extend({
  args: { onLocationChange: fn() },
  play: async ({ canvas, userEvent }) => {
    await selectOption(canvas, userEvent, 'relevance', /^immunotherapy/);
    const addBtn = await canvas.findByText(/add to selected group/i);
    await waitFor(() => expect(addBtn).toBeEnabled());
    await userEvent.click(addBtn);
  },
});

WithFilterGroup.test('clicking search navigates to results page', async ({ canvas, args, userEvent }) => {
  const search = await canvas.findByText(/search/i);
  await waitFor(async () => expect(search).toBeEnabled());
  await userEvent.click(search);
  await waitFor(() => expect(args.onLocationChange).toHaveBeenLastCalledWith(
    {
      pathname: '/data/table',
      search: '?%40class=Statement&complex=eyJ0YXJnZXQiOiJTdGF0ZW1lbnQiLCJmaWx0ZXJzIjpbeyJvcGVyYXRvciI6IklOIiwicmVsZXZhbmNlIjpbIiMxMTE6MTExIl19XX0%253D',
    },
    {
      state: {
        query: {
          filters: [{
            operator: 'IN',
            relevance: ['#111:111'],
          }],
          target: 'Statement',
        },
      },
    },
  ));
});
