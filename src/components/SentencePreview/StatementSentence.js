import React from 'react';

import { StatementPropType } from '@/components/types';
import schema from '@/services/schema';

import SentencePreview from '.';


const StatementSentence = ({ content: record }) => {
  const { content, highlighted } = schema.buildStatementSentence(record);

  return (
    <SentencePreview
      content={content}
      highlighted={highlighted}
    />
  );
};

StatementSentence.propTypes = {
  content: StatementPropType,
};

StatementSentence.defaultProps = {
  content: {},
};

export default StatementSentence;
