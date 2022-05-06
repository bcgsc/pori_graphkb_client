import { sentenceTemplates } from '@bcgsc-pori/graphkb-schema';
import React from 'react';

import { StatementType } from '@/components/types';
import schema from '@/services/schema';

import SentencePreview from '.';

interface StatementSentenceProps {
  content?: StatementType;
}

const StatementSentence = ({ content: record }: StatementSentenceProps) => {
  const { content, highlighted } = sentenceTemplates.generateStatementSentence(schema.schemaDefn, record);

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
