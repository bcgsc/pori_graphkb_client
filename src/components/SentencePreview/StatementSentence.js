import React from 'react';

import { StatementPropType } from '@/components/types';

import SentencePreview from '.';


const naturalListJoin = (words) => {
  if (words.length > 1) {
    return `${words.slice(0, words.length - 1).join(', ')}, and ${words[words.length - 1]}`;
  }
  return words[0];
};


const StatementSentence = ({ content: record }) => {
  const substitutions = {
    '{conditions}': '[conditions]',
    '{subject}': '[subject]',
    '{relevance}': '[relevance]',
    '{evidence}': '[evidence]',
  };
  const highlighted = [];

  if (record.subject) {
    const preview = record.subject.displayName || record.subject;
    substitutions['{subject}'] = preview;
    highlighted.push(preview);
  }

  if (record.relevance) {
    const preview = record.relevance.displayName || record.relevance;
    substitutions['{relevance}'] = preview;
    highlighted.push(preview);
  }

  if (record.conditions && record.conditions.length) {
    const words = record.conditions
      .map(cond => cond.displayName || cond)
      .filter(word => word !== substitutions['{subject}']);
    highlighted.push(...words);

    substitutions['{conditions}'] = naturalListJoin(words);
  }

  if (record.evidence && record.evidence.length) {
    const words = record.evidence
      .map(rec => rec.displayName || rec);
    highlighted.push(...words);

    substitutions['{evidence}'] = words.join(', ');
  }


  let content = record.displayNameTemplate || 'Given {conditions}, {relevance} applies to {subject} ({evidence})';

  Object.keys(substitutions).forEach((key) => {
    content = content.replace(key, substitutions[key]);
  });

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
