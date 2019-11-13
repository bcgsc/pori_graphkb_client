import React from 'react';
import { titleCase } from 'change-case';
import PropTypes from 'prop-types';

import SentencePreview from '.';


const EdgeSentence = ({ srcRecord, tgtRecord, type }) => {
  let edgeType = titleCase(type);

  if (edgeType.endsWith('Of')) {
    edgeType = `is a ${edgeType}`;
  }
  const words = [
    srcRecord
      ? srcRecord.displayName
      : '[source record]',
    edgeType,
    tgtRecord
      ? tgtRecord.displayName
      : '[target record]',
  ];


  const highlights = [];

  if (srcRecord) {
    highlights.push(srcRecord.displayName);
  }

  if (tgtRecord) {
    highlights.push(tgtRecord.displayName);
  }

  return (
    <SentencePreview
      content={words.join(' ')}
      highlighted={highlights}
    />
  );
};

EdgeSentence.propTypes = {
  srcRecord: PropTypes.object,
  tgtRecord: PropTypes.object,
  type: PropTypes.string.isRequired,
};


EdgeSentence.defaultProps = {
  srcRecord: null,
  tgtRecord: null,
};

export default EdgeSentence;
