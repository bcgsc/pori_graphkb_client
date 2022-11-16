import { schema as schemaDefn, sentenceTemplates } from '@bcgsc-pori/graphkb-schema';
import React from 'react';

import { StatementType } from '@/components/types';

import SentencePreview from '.';

interface StatementSentenceProps {
  content?: Partial<StatementType>;
}

const StatementSentence = ({ content: record }: StatementSentenceProps) => {
  const { content, highlighted } = sentenceTemplates.generateStatementSentence(schemaDefn, record);

  return (
    <SentencePreview
      content={content}
      highlighted={highlighted}
    />
  );
};

StatementSentence.defaultProps = {
  content: {},
};

export default StatementSentence;
