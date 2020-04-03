import './index.scss';

import { Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';


const chunkSentence = (sentence, words) => {
  let chunkPositions = new Set([0, sentence.length]);

  words.forEach((word) => {
    const index = sentence.indexOf(word);

    if (index >= 0) {
      chunkPositions.add(index);
      chunkPositions.add(index + word.length);
    }
  });
  chunkPositions = Array.from(chunkPositions).sort((a, b) => a - b);
  const chunks = [];

  for (let index = 1; index < chunkPositions.length; index++) {
    const prev = chunkPositions[index - 1];
    const curr = chunkPositions[index];
    chunks.push(sentence.slice(prev, curr));
  }
  return chunks;
};


/**
 * @param {Object} props
 * @param {string} props.content the sentence
 * @param {Array.<string>} props.highlighted list of words to emphasize from the sentence
 */
const SentencePreview = ({ content, highlighted }) => {
  if (!content || !content.length) {
    return null;
  }

  // find the positions of the highlighted terms by matching words
  const chunks = chunkSentence(content, highlighted);

  const sentence = chunks.map((chunk, i) => {
    if (highlighted.includes(chunk)) {
      return (<mark key={`highlight-${i}`} className="sentence-preview__chunk--highlighted">{chunk}</mark>); // eslint-disable-line react/no-array-index-key
    }
    return (<span key={`word-${i}`} className="sentence-preview__chunk">{chunk}</span>); // eslint-disable-line react/no-array-index-key
  });

  return (
    <Typography className="sentence-preview">
      {sentence}
    </Typography>
  );
};


SentencePreview.propTypes = {
  content: PropTypes.string.isRequired,
  highlighted: PropTypes.array,
};

SentencePreview.defaultProps = {
  highlighted: [],
};

export { chunkSentence };

export default SentencePreview;
