import './index.scss';

import { OpenInNew } from '@mui/icons-material';
import React from 'react';
import { Link } from 'react-router';

interface RecordIdLinkProps {
  recordClass: string;
  recordId: string;
}

const RecordIdLink = ({ recordId, recordClass }: RecordIdLinkProps) => {
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
};

export default RecordIdLink;
