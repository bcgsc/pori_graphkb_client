
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

DownloadFileComponent.propTypes = {
  /**
   * @param {string} mediaType - File media type.
   */
  mediaType: PropTypes.string,
  /**
   * @param {function} rawFileContent - Raw file data.
   */
  rawFileContent: PropTypes.func,
  /**
   * @param {string} fileName - Filename of file to be downloaded.
   */
  fileName: PropTypes.string,
  /**
   * @param {Node} children - Children components to be rendered beneath wrapper.
   */
  children: PropTypes.node.isRequired,
  /**
   * @param {string} id - CSS identifier for styling.
   */
  id: PropTypes.string,
  /**
   * @param {string} className - CSS class name for styling.
   */
  className: PropTypes.string,
  /**
   * @param {object} style - Object of individual CSS properties for styling.
   */
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
