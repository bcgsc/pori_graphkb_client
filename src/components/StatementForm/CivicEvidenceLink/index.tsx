import './index.scss';

import React from 'react';

import civicLogo from '@/static/images/civic_logo.png';

interface CivicEvidenceLinkProps {
  evidenceId: string;
}

const CivicEvidenceLink = ({ evidenceId }: CivicEvidenceLinkProps) => (
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

export default CivicEvidenceLink;
