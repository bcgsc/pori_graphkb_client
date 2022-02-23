import { sentenceTemplates } from '@bcgsc-pori/graphkb-schema';
import React from 'react';

import { StatementPropType } from '@/components/types';
import schema from '@/services/schema';

import SentencePreview from '.';

function StatementSentence({ content: record }) {
  const { content, highlighted } = sentenceTemplates.generateStatementSentence(schema.schemaDefn, record);

  return (
    <SentencePreview
      content={content}
      highlighted={highlighted}
    />
  );
}

StatementSentence.propTypes = {
  content: StatementPropType,
};

StatementSentence.defaultProps = {
  content: {},
};

export default StatementSentence;
