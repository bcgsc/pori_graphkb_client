import './index.scss';

import { Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

const chunkSentence = (sentence, words) => {
  const chunksMap = new Map();

  words.forEach((word) => {
    const currentIdxs = [];
    let startIndex = 0;

    // eslint-disable-next-line no-cond-assign
    while (startIndex < sentence.length) {
      startIndex = sentence.indexOf(word, startIndex);

      if (startIndex < 0) {
        break;
      }
      currentIdxs.push(startIndex);
      startIndex += 1;
    }

    currentIdxs.forEach((index) => {
      // Check if it already exists
      if (chunksMap.get(index) === undefined) {
        chunksMap.set(index, index + word.length); // New chunk
      } else {
        const currLength = chunksMap.get(index);
        const newLength = index + word.length;
        chunksMap.set(index, currLength < newLength ? newLength : currLength); // Take longest chunk
      }
    });
  });

  const ranges = [...chunksMap.entries()].sort((a, b) => a[0] - b[0]);
  let lastPos;
  let chunkPositions = [];
  ranges.forEach((r) => {
    if (!lastPos || r[0] > lastPos[1]) {
      chunkPositions.push(lastPos = r);
    } else if (r[1] > lastPos[1]) {
      lastPos[1] = r[1];
    }
  });

  // Add first and last index if not there
  if (!chunkPositions.includes(0)) { chunkPositions.unshift(0); }
  if (!chunkPositions.includes(sentence.length)) { chunkPositions.push([sentence.length]); }

  // Flatten 2d array
  chunkPositions = [].concat(...chunkPositions);

  const chunks = [];

  for (let index = 1; index < chunkPositions.length; index++) {
    const prev = chunkPositions[index - 1];
    const curr = chunkPositions[index];

    if (prev === curr) { continue; }

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
