import './index.scss';

import PropTypes from 'prop-types';
import React from 'react';

import civicLogo from '@/static/images/civic_logo.png';


const CivicEvidenceLink = ({ evidenceId }) => (
  <a
    className="civic-evidence-link"
    href={`https://civicdb.org/links/evidence/${evidenceId}`}
    rel="noopener noreferrer"
    target="_blank"
  >
    <img
      alt="civic logo"
      src={civicLogo}
    />
  </a>
);


CivicEvidenceLink.propTypes = {
  evidenceId: PropTypes.string.isRequired,
};

export default CivicEvidenceLink;
