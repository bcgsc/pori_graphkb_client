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
            &nbsp;{word}
          </Typography>
        );
      }
      return (
        <>
          &nbsp;{word}
        </>
      );
    });
    return words;
  };

  const classModel = schema.get(content['@class']);
  let { properties: { displayNameTemplate: { default: displayNameTemplate } } } = classModel;

  const appliesTo = (Array.isArray(content.appliesTo) ? content.appliesTo : [content.appliesTo] || [])
    .map(apply => schema.getPreview(apply)).join(', ');

  const relevance = (Array.isArray(content.relevance) ? content.relevance : [content.relevance] || [])
    .map(rel => schema.getPreview(rel)).join(', ');

  const supportedBy = (content.supportedBy || [])
    .map(support => schema.getPreview(support)).join(', ');

  let conditions = (content.impliedBy || [])
    .map(cond => schema.getPreview(cond));

  if (conditions.length > 1) {
    conditions[conditions.length - 1] = `and ${conditions[conditions.length - 1]}`;
  }
  conditions = conditions.join(', ');

  let givenStatement = ' ';
  let appliesStatement = ' ';
  [givenStatement, displayNameTemplate] = displayNameTemplate.split(' {impliedBy} ');
  [, displayNameTemplate] = displayNameTemplate.split('{relevance}');
  [appliesStatement, displayNameTemplate] = displayNameTemplate.split('{appliesTo} ');

  return (
    <Typography variant="body1" className="quote" color="textSecondary">
      {givenStatement} &nbsp;
      {PrimaryText(conditions) || ' [CONDITIONS] '},
      {PrimaryText(relevance) || ' [RELEVANCE] '}
      {appliesStatement} &nbsp;
      {PrimaryText(appliesTo) || ' [TARGET] '}
      {PrimaryText(supportedBy) || ' [EVIDENCE] '}
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
