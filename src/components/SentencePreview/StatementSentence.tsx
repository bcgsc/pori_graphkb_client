import { schema as schemaDefn, sentenceTemplates } from '@bcgsc-pori/graphkb-schema';
import { StatementRecord } from '@bcgsc-pori/graphkb-schema/dist/types';
import React from 'react';


import { StatementType } from '@/components/types';

import SentencePreview from '.';

interface StatementSentenceProps {
  content?: StatementRecord;
}

const StatementSentence = ({ content: record }: StatementSentenceProps) => {
  const { content, highlighted } = sentenceTemplates.generateStatementSentence(schemaDefn.getPreview, record);

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
