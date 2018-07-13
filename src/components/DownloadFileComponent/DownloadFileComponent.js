import React from 'react';
import PropTypes from 'prop-types';

function DownloadFileComponent(props) {
  const {
    mediaType,
    base64,
    rawFileContent,
    fileName,
    children,
    id,
    className,
    style,
  } = props;

  const onClick = () => {
    const file = rawFileContent();
    if (!file) return;

    if (window.Cypress) return;

    const uri = `data:${mediaType}${base64 ? `;${base64}` : null},${encodeURIComponent(file)}`;

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
      id={id}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}

DownloadFileComponent.propTypes = {
  mediaType: PropTypes.string,
  base64: PropTypes.string,
  rawFileContent: PropTypes.func,
  fileName: PropTypes.string,
  children: PropTypes.node.isRequired,
  id: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
};

DownloadFileComponent.defaultProps = {
  mediaType: 'text/plain;charset=US-ASCII',
  base64: null,
  rawFileContent: null,
  fileName: 'download.txt',
  id: undefined,
  className: undefined,
  style: undefined,
};

export default DownloadFileComponent;
