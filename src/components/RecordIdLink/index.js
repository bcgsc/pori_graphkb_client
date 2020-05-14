import './index.scss';

import { OpenInNew } from '@material-ui/icons';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';


const RecordIdLink = ({ recordId, recordClass }) => (
  <Link className="record-link" target="_blank" to={`/view/${recordClass}/${recordId.replace(/^#/, '')}`}>
    <span>
      {recordId}
    </span>
    <OpenInNew />
  </Link>
);

RecordIdLink.propTypes = {
  recordClass: PropTypes.string.isRequired,
  recordId: PropTypes.string.isRequired,
};

export default RecordIdLink;
