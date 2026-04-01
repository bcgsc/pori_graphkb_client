import { titleCase } from 'change-case';
import React from 'react';

import { GeneralRecordType } from '../types';
import SentencePreview from '.';

interface EdgeSentenceProps {
  type: string;
  srcRecord?: GeneralRecordType;
  tgtRecord?: GeneralRecordType;
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

  const highlights: string[] = [];

  if (srcRecord?.displayName) {
    highlights.push(srcRecord.displayName);
  }

  if (tgtRecord?.displayName) {
    highlights.push(tgtRecord.displayName);
  }

  return (
    <SentencePreview
      content={words.join(' ')}
      highlighted={highlights}
    />
  );
};

export default EdgeSentence;
