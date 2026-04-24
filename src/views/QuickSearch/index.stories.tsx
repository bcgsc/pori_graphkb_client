import { expect } from 'storybook/test';

import preview, {
  view, ViewPreviewType,
} from '#.storybook/preview';

const meta = preview.type<ViewPreviewType>().meta({ ...view });

export const Default = meta.story({
  args: {
    path: '/query',
  },
  play: async ({ canvas }) => {
    await expect(canvas.findByPlaceholderText('Search Statements by Keyword')).resolves.toBeEnabled();
  },
});

export const WithHgvsChecked = meta.story({
  args: {
    path: '/query',
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByLabelText('HGVS Shorthand'));
    await userEvent.tab();
    await expect(canvas.findByPlaceholderText('Search Statements by HGVS Shorthand')).resolves.toBeEnabled();
  },
});
