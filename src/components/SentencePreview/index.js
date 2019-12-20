import './index.scss';

import { Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';


const STOP_WORDS = new Set([
  'and', 'is', 'a', 'the', 'of', 'in',
]);

const normalizeTerm = term => term.replace(/[),]$/, '').replace(/^\(/, '').trim().toLowerCase();


/**
 * Find the all positions in a parent array which are part of a complete match to the child array
 *
 * @param {Array} arr the parent array
 * @param {Array} subArr the child/subset array
 *
 * @returns {Array.<Number>} the array of all matching start positions
 *
 * @example
 * indexOfSubArray([1, 2, 3, 4], [3, 4])
 * // [2, 3]
 */
const indexOfSubArray = (arr, subArr) => {
  if (!subArr.length) {
    return null;
  }

  const matches = [];

  for (let startIndex = 0; startIndex < arr.length; startIndex++) {
    let matched = true;
    const currentMatches = [];

    for (let subIndex = 0; subIndex < subArr.length && (startIndex + subIndex) < arr.length; subIndex++) {
      const parentIndex = startIndex + subIndex;

      if (normalizeTerm(arr[parentIndex]) !== normalizeTerm(subArr[subIndex])) {
        // ignore trailing commas

        matched = false;
        break;
      }
      currentMatches.push(parentIndex);
    }

    if (matched) {
      matches.push(...currentMatches);
    }
  }
  return matches;
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

  const words = content.split(/\s+/g);

  // find the positions of the highlighted terms by matching words
  const highlightedPositions = [];
  highlighted.forEach((term) => {
    if (term) {
      const matches = indexOfSubArray(words.map(word => word), term.split(/\s+/g));

      if (matches) {
        highlightedPositions.push(...matches);
      }
    }
  });

  const sentence = words.map((word, wordPosition) => {
    const isStopWord = STOP_WORDS.has(word.toLowerCase());

    if (highlightedPositions.includes(wordPosition) && !isStopWord) {
      return (
        // if a word changes position within the sentence we re-render the sentence so this is a valid key here
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={wordPosition}>
          {/^\(/.exec(word) ? word[0] : ''}
          <Typography
            className="sentence-preview__word--highlighted"
            color="textPrimary"
            component="span"
            variant="body1"
          >
            {
            wordPosition === 0
              ? null
              : (<span> </span>)
          }
            {word.replace(/[,),]$/, '').replace(/^\(/, '')}

          </Typography>
          {/[,),]$/.exec(word) ? word[word.length] : ''}
        </React.Fragment>
      );
    }
    return (
      <>
        {
          wordPosition === 0 || word === ','
            ? null
            : (<span> </span>)
        }
        {
          isStopWord
            ? word.toLowerCase()
            : word
        }
      </>
    );
  });

  return (
    <div className="sentence-preview">
      {sentence}
    </div>
  );
};


SentencePreview.propTypes = {
  content: PropTypes.string.isRequired,
  highlighted: PropTypes.array,
};

SentencePreview.defaultProps = {
  highlighted: [],
};


export { indexOfSubArray };
export default SentencePreview;
