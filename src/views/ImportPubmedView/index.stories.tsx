import { expect } from 'storybook/test';

import preview, {
  view, ViewPreviewType,
} from '#.storybook/preview';

const meta = preview.type<ViewPreviewType>().meta({ ...view });

export const Default = meta.story({
  args: {
    path: '/import/pubmed',
  },
  play: async ({ canvas }) => {
    await expect(canvas.findByPlaceholderText('Enter a PubMed ID ex. 1234')).resolves.toBeEnabled();
  },
});
