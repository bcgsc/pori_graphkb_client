import preview from '#.storybook/preview';

import component from './StatementSentence';

const meta = preview.meta({
  component,
});

export const Empty = meta.story();

export const PartialValue = meta.story({
  args: {
    content: {
      conditions: [
        { displayName: 'condition1', '@class': 'Variant' },
        { displayName: 'condition2', '@class': 'Disease' },
      ],
    },
  },
});

export const FullValue = meta.story({
  args: {
    content: {
      conditions: [{ displayName: 'KRAS mutation', '@class': 'CategoryVariant', '@rid': '1' }],
      subject: { displayName: 'drugName', '@class': 'Therapy' },
      evidence: [{ displayName: 'PMID:1234', '@class': 'Evidence' }],
      relevance: { displayName: 'sensitivity', '@class': 'Vocabulary' },
    },
  },
});
