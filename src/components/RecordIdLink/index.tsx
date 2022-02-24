import './index.scss';

import { OpenInNew } from '@material-ui/icons';
import React from 'react';
import { Link } from 'react-router-dom';

interface RecordIdLinkProps {
  recordClass: string;
  recordId: string;
}

function RecordIdLink(props: RecordIdLinkProps) {
  const {
    recordId,
    recordClass,
  } = props;

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

export default RecordIdLink;
