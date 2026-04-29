import { HttpResponse } from 'msw';
import { expect } from 'storybook/test';

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
    path: '/data/table?%40class=Therapy&complex=eyJ0YXJnZXQiOiJUaGVyYXB5In0%253D',
  },
  parameters: {
    msw: {
      handlers: [
        http.gkb.query(() => [
          {
            '@class': 'Therapy', '@rid': '#111:111', count: 2, name: 'immunotherapy', source: { displayName: 'source 1234' },
          },
          {
            '@class': 'Therapy', '@rid': '#111:222', count: 2, name: 'immunological therapy',
          },
        ]),
      ],
    },
  },
});

export const WithError = WithRows.extend({
  parameters: {
    msw: {
      handlers: [
        http.gkb.query(() => HttpResponse.json({ message: 'Bad Request' }, { status: 400 })),
      ],
    },
  },
});

export const WithDetailsOpen = WithRows.extend({
  play: async ({ canvas, step, userEvent }) => {
    await hasFinishedLoading({ canvas, step });
    await userEvent.click(await canvas.findByText('source 1234'));
    await expect(await canvas.findByText('immunotherapy (#111:111)')).toBeInTheDocument();
  },
});

export const WithDetailsOpenError = WithRows.extend({
  parameters: {
    msw: {
      handlers: [
        http.gkb.query((body) => {
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
        }),
      ],
    },
  },
  play: async ({ canvas, step, userEvent }) => {
    await hasFinishedLoading({ canvas, step });
    await userEvent.click(await canvas.findByText('source 1234'));
    await expect(await canvas.findByText('BadRequestError')).toBeInTheDocument();
  },
});
