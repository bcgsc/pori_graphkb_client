import { expect } from 'storybook/test';

import { GeneralRecordType } from '@/components/types';
import preview, {
  hasFinishedLoading,
  http,
  view, ViewPreviewType,
} from '#.storybook/preview';

const meta = preview.type<ViewPreviewType>().meta({ ...view });

export const GraphNoNodes = meta.story({
  args: {
    path: '/data/graph',
  },
});

export const GraphOneNode = meta.story({
  args: {
    path: `/data/graph?nodes=${encodeURIComponent(btoa(JSON.stringify(['#123:123'])))}`,
  },
  parameters: {
    msw: {
      handlers: [
        http.gkb.query((body) => {
          const rids = body.target as string[];
          const mainRecord = {
            '@class': 'Therapy',
            '@rid': '#123:123',
            name: 'immunotherapy',
            in_AliasOf: [
              {
                in: '#123:123',
                out: {
                  displayName: 'immunological therapy [c15262]',
                  name: 'immunological therapy',
                  alias: true,
                  '@class': 'Therapy',
                  '@rid': '#124:124',
                },
                '@class': 'AliasOf',
                '@rid': '#68:68',
              },
              {
                in: '#123:123',
                out: {
                  displayName: 'immunological [c15262]',
                  name: 'immunological',
                  alias: true,
                  '@class': 'Therapy',
                  '@rid': '#122:122',
                },
                '@class': 'AliasOf',
                '@rid': '#65:65',
              },
            ],
          };
          const recordsById: Record<string, unknown> = {
            [mainRecord['@rid']]: mainRecord,
          };
          mainRecord.in_AliasOf.forEach((edge) => {
            recordsById[edge['@rid']] = { ...edge, out: { ...edge.out } };
            recordsById[edge.out['@rid']] = { ...edge.out };
          });
          return rids.map((rid) => recordsById[rid]).filter(Boolean) as GeneralRecordType[];
        }),
      ],
    },
  },
  play: async ({ canvas, step }) => {
    await hasFinishedLoading({ canvas, step });
    await expect(await canvas.findByLabelText('immunotherapy')).toBeInTheDocument();
  },
});

export const GraphOneNodeDetailsOpen = GraphOneNode.extend({
  play: async ({ canvas, step, userEvent }) => {
    await hasFinishedLoading({ canvas, step });
    const node = await canvas.findByLabelText('immunotherapy');
    await userEvent.click(node);
    await expect(await canvas.findByText('immunological therapy [c15262] (#124:124)')).toBeInTheDocument();
  },
});

export const GraphOneNodeExpanded = GraphOneNode.extend({
  play: async ({ canvas, userEvent, context }) => {
    await GraphOneNodeDetailsOpen.play(context);
    await userEvent.click(await canvas.findByLabelText('expand'));
    await expect(await canvas.findByText('immunological therapy [c15262]')).toBeInTheDocument();
    await expect(await canvas.findByText('immunological [c15262]')).toBeInTheDocument();
  },
  tags: ['flaky'],
  parameters: {
    // behaviour of graph component is not consistent without a full page refresh
    // so not possible to use snapshots currently
    snapshot: false,
  },
});
