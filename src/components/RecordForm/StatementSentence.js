import React from 'react';
import { Typography } from '@material-ui/core';
import PropTypes from 'prop-types';

const StatementSentence = (props) => {
  const {
    schema,
    content,
  } = props;
  console.log('TCL: StatementSentence -> content', content);


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

  const propValueMap = {
    impliedBy: {
      value: conditions,
      default: ' [CONDITIONS] ',
    },
    appliesTo: {
      value: appliesTo,
      default: ' [TARGET] ',
    },
    relevance: {
      value: relevance,
      default: ' [RELEVANCE] ',
    },
    supportedBy: {
      value: supportedBy,
      default: ' [EVIDENCE] ',
    },
  };

  const classModel = schema.get('Statement');
  const { properties: { displayNameTemplate: { default: displayNameTemplate } } } = classModel;
  const statementProp = Object.keys(propValueMap);
  const splitTemplate = displayNameTemplate.split(/{+(impliedBy|relevance|appliesTo|supportedBy)}+/ig);

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
