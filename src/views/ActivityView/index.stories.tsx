import preview, {
  http, view, ViewPreviewType,
} from '#.storybook/preview';

const meta = preview.type<ViewPreviewType>().meta({ ...view });

export const Default = meta.story({
  args: {
    path: '/activity',
  },
  parameters: {
    msw: {
      handlers: [
        http.gkb.query((body) => {
          if (body.target === 'V') {
            return [{
              '@rid': '#1:1',
              updatedBy: { name: 'thelma' },
              updatedAt: new Date(2020, 0, 1).getTime(),
              '@class': 'CategoryVariant',
              displayName: 'SUZ12 structural variant',
            }];
          }
          if (body.target === 'E') {
            return [{
              '@class': 'Infers',
              '@rid': '#1234:777',
              updatedBy: { name: 'louise' },
              updatedAt: new Date(2026, 6, 13).getTime(),
            }];
          }
          return [];
        }),
      ],
    },
  },
});
