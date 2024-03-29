import { titleCase } from 'change-case';
import React from 'react';

import SentencePreview from '.';

interface EdgeSentenceProps {
  type: string;
  srcRecord?: Record<string, unknown>;
  tgtRecord?: Record<string, unknown>;
}

const EdgeSentence = ({ srcRecord, tgtRecord, type }: EdgeSentenceProps) => {
  let edgeType = titleCase(type);

  if (edgeType.endsWith('Of')) {
    edgeType = `is a ${edgeType}`;
  }
  const words = [
    srcRecord
      ? srcRecord.displayName
      : '[source record]',
    edgeType,
    tgtRecord
      ? tgtRecord.displayName
      : '[target record]',
  ];

  const highlights = [];

  if (srcRecord) {
    highlights.push(srcRecord.displayName);
  }

  if (tgtRecord) {
    highlights.push(tgtRecord.displayName);
  }

  return (
    <SentencePreview
      content={words.join(' ')}
      highlighted={highlights}
    />
  );
};

EdgeSentence.defaultProps = {
  srcRecord: null,
  tgtRecord: null,
};

export default EdgeSentence;
