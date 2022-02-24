import './index.scss';

import { OpenInNew } from '@material-ui/icons';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';

function RecordIdLink({ recordId, recordClass }) {
  if (!recordId || !recordClass) {
    return null;
  }
  if (!recordClass) {
    return (
      <Link className="record-link" target="_blank" to={`/view/${recordId.replace(/^#/, '')}`}>
        <span>
          {recordId}
        </span>
        <OpenInNew />
      </Link>
    );
  }
  return (
    <Link className="record-link" target="_blank" to={`/view/${recordClass}/${recordId.replace(/^#/, '')}`}>
      <span>
        {recordId}
      </span>
      <OpenInNew />
    </Link>
  );
}

RecordIdLink.propTypes = {
  recordClass: PropTypes.string.isRequired,
  recordId: PropTypes.string.isRequired,
};

export default RecordIdLink;
