
/**
 * @module /components/DownloadFileComponent
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Wrapper component to enable downloading of content.
 */
function DownloadFileComponent(props) {
  const {
    mediaType,
    rawFileContent,
    fileName,
    children,
    id,
    className,
    style,
  } = props;

  /**
   * Start download method.
   */
  const onClick = () => {
    const file = typeof rawFileContent === 'function'
      ? rawFileContent()
      : rawFileContent;
    if (!file) return;

    if (window.Cypress) return;
    const blob = new Blob([file], { type: mediaType });
    if (window.navigator.msSaveBlob) {
      // FOR IE BROWSER
      navigator.msSaveBlob(blob, fileName);
    } else {
      const tsvUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = tsvUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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

/**
 * @namespace
 * @property {string} mediaType - File media type.
 * @property {function} rawFileContent - Raw file data.
 * @property {string} fileName - Filename of file to be downloaded.
 * @property {Node} children - Children components to be rendered beneath wrapper.
 * @property {string} id - CSS identifier for styling.
 * @property {string} className - CSS class name for styling.
 * @property {object} style - Object of individual CSS properties for styling.
 */
DownloadFileComponent.propTypes = {
  mediaType: PropTypes.string,
  rawFileContent: PropTypes.any,
  fileName: PropTypes.string,
  children: PropTypes.node.isRequired,
  id: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
};

DownloadFileComponent.defaultProps = {
  mediaType: 'text/plain;charset=US-ASCII',
  rawFileContent: null,
  fileName: 'download.txt',
  id: undefined,
  className: undefined,
  style: undefined,
};

export default DownloadFileComponent;
