
/**
 * @module /components/DownloadFileComponent
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Wrapper component to enable downloading of content.
 * @param {Object} props - component properties.
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
    const file = rawFileContent();
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
 * @param {string} mediaType - File media type.
 * @param {function} rawFileContent - Raw file data.
 * @param {string} fileName - Filename of file to be downloaded.
 * @param {Node} children - Children components to be rendered beneath wrapper.
 * @param {string} id - CSS identifier for styling.
 * @param {string} className - CSS class name for styling.
 * @param {object} style - Object of individual CSS properties for styling.
 */
DownloadFileComponent.propTypes = {
  mediaType: PropTypes.string,
  rawFileContent: PropTypes.func,
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
