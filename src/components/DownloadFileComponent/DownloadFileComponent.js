import React from 'react';
import PropTypes from 'prop-types';

function DownloadFileComponent(props) {
  const {
    mediaType,
    base64,
    rawFileContent,
    fileName,
    children,
  } = props;

  const onClick = () => {
    if (!rawFileContent) return;
    const uri = `data:${mediaType}${base64 ? `;${base64}` : null},${encodeURIComponent(rawFileContent)}`;

    const link = document.createElement('a');
    link.download = fileName;
    link.href = uri;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
  };

  return (
    <div
      onClick={onClick}
      onKeyUp={(e) => { if (e.keyCode === 13) onClick(); }}
      role="button"
      tabIndex={0}
    >
      {children}
    </div>
  );
}

DownloadFileComponent.propTypes = {
  mediaType: PropTypes.string,
  base64: PropTypes.string,
  rawFileContent: PropTypes.string,
  fileName: PropTypes.string,
  children: PropTypes.node.isRequired,
};

DownloadFileComponent.defaultProps = {
  mediaType: 'text/plan;charset=US-ASCII',
  base64: null,
  rawFileContent: '',
  fileName: 'download.txt',
};

export default DownloadFileComponent;
