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

  const appliesTo = (Array.isArray(content.appliesTo) ? content.appliesTo : [content.appliesTo] || [])
    .map(apply => schema.getPreview(apply)).join(', ');

  const relevance = schema.getPreview(content.relevance);

  const supportedBy = (content.supportedBy || [])
    .map(support => schema.getPreview(support)).join(', ');

  let conditions = (content.impliedBy || [])
    .map((cond) => { console.log(cond); return schema.getPreview(cond); });
  console.log('TCL: StatementSentence -> conditions', conditions);

  if (conditions.length > 1) {
    conditions[conditions.length - 1] = `and ${conditions[conditions.length - 1]}`;
  }
  conditions = conditions.join(', ');

  return (
    <Typography variant="body1" className="quote" color="textSecondary">
      Given
      {PrimaryText(conditions) || ' [CONDITIONS]'},
      {PrimaryText(relevance) || ' [RELEVANCE]'}&nbsp;
      applies to
      {PrimaryText(appliesTo) || ' [TARGET]'}&nbsp;
      ({PrimaryText(supportedBy) || ' [EVIDENCE]'} )
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
