import { sentenceTemplates } from '@bcgsc-pori/graphkb-schema';
import { StatementRecord } from '@bcgsc-pori/graphkb-schema/dist/types';
import React from 'react';

import schema from '@/services/schema';

import { StatementType } from '../types';
import SentencePreview from '.';

interface StatementSentenceProps {
  content?: Partial<StatementType>;
}

const StatementSentence = ({ content: record = {} }: StatementSentenceProps) => {
  const { content, highlighted } = sentenceTemplates.generateStatementSentence(schema.getPreview, record as StatementRecord);

  return (
    <SentencePreview
      content={content}
      highlighted={highlighted}
    />
  );
};

export default StatementSentence;
