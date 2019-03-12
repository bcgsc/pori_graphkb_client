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
    return (
      <Typography component="span" variant="body1" color="textPrimary" className="quote__substitution">
        {text}
      </Typography>
    );
  };

  const appliesTo = schema.getPreview(content.appliesTo);
  const relevance = schema.getPreview(content.relevance);
  const supportedBy = (content.supportedBy || [])
    .map(support => schema.getPreview(support.target)).join(', ');
  let conditions = (content.impliedBy || [])
    .map(cond => schema.getPreview(cond.target));

  if (conditions.length > 1) {
    conditions[conditions.length - 1] = `and ${conditions[conditions.length - 1]}`;
  }
  conditions = conditions.join(', ');

  return (
    <Typography variant="body1" className="quote" color="textSecondary">
      Given&nbsp;
      {PrimaryText(conditions) || '[CONDITIONS]'},&nbsp;
      {PrimaryText(relevance) || '[RELEVANCE]'}&nbsp;
      applies to&nbsp;
      {PrimaryText(appliesTo) || '[TARGET]'}&nbsp;
      ({PrimaryText(supportedBy) || '[EVIDENCE]'})
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
