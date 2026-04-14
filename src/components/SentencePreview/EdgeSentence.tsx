import { titleCase } from 'change-case';
import React from 'react';

import { GeneralRecordType } from '../types';
import SentencePreview from '.';

interface EdgeSentenceProps {
  type: string;
  srcRecord?: GeneralRecordType | string;
  tgtRecord?: GeneralRecordType | string;
}

const EdgeSentence = ({ srcRecord, tgtRecord, type }: EdgeSentenceProps) => {
  let edgeType = titleCase(type);

  if (edgeType.endsWith('Of')) {
    edgeType = `is a ${edgeType}`;
  }
  const words = [
    srcRecord && typeof srcRecord !== 'string'
      ? srcRecord.displayName
      : '[source record]',
    edgeType,
    tgtRecord && typeof tgtRecord !== 'string'
      ? tgtRecord.displayName
      : '[target record]',
  ];

  const highlights: string[] = [];

  if (typeof srcRecord !== 'string' && srcRecord?.displayName) {
    highlights.push(srcRecord.displayName);
  }

  if (typeof tgtRecord !== 'string' && tgtRecord?.displayName) {
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
