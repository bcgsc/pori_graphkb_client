import React from 'react';
import { Typography } from '@material-ui/core';
import PropTypes from 'prop-types';

const StatementSentence = (props) => {
  const {
    schema,
    content,
  } = props;

  const PrimaryText = (text) => {
    if (!text) {
      return null;
    }
    const words = text.split(' ').map((word, wordPosition) => {
      if (word !== 'and') {
        return (
          // if a word changes position within the sentence we re-render the sentence so this is a valid key here
          <Typography
            key={wordPosition} // eslint-disable-line react/no-array-index-key
            component="span"
            variant="body1"
            color="textPrimary"
            className="quote__substitution"
          >
            {wordPosition === 0 ? null : (<span> </span>)}{word}
          </Typography>
        );
      }
      return (
        <>
          <span> </span>{word}
        </>
      );
    });

    return words;
  };

  const subject = schema.getPreview(content.subject);

  const relevance = schema.getPreview(content.relevance);

  const evidence = (content.evidence || [])
    .map(support => schema.getPreview(support)).join(', ');

  let conditions = (content.conditions || [])
    .map(cond => (subject !== schema.getPreview(cond) ? schema.getPreview(cond) : ''))
    .filter(cond => cond);

  if (conditions.length > 1) {
    conditions[conditions.length - 1] = `and ${conditions[conditions.length - 1]}`;
  }
  conditions = conditions.join(', ');

  const propValueMap = {
    conditions: {
      value: conditions,
      default: ' [CONDITIONS] ',
    },
    subject: {
      value: subject,
      default: ' [TARGET] ',
    },
    relevance: {
      value: relevance,
      default: ' [RELEVANCE] ',
    },
    evidence: {
      value: evidence,
      default: ' [EVIDENCE] ',
    },
  };

  const classModel = schema.get('Statement');
  const { properties: { displayNameTemplate: { default: displayNameTemplate } } } = classModel;
  const statementProp = Object.keys(propValueMap);
  const splitTemplate = displayNameTemplate.split(/{+(conditions|relevance|subject|evidence)}+/ig);

  const statementSentence = splitTemplate.map((text) => {
    let result = `${text}`;
    statementProp.forEach((prop) => {
      if (text === prop) {
        result = PrimaryText(propValueMap[prop].value) || propValueMap[prop].default;
      }
    });
    return result;
  });

  return (
    <Typography variant="body1" className="quote" color="textSecondary">
      {statementSentence}
    </Typography>
  );
};

StatementSentence.propTypes = {
  schema: PropTypes.object.isRequired,
  content: PropTypes.object,
};

StatementSentence.defaultProps = {
  content: {},
};

export default StatementSentence;
