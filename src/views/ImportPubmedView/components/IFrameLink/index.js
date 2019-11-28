import './index.scss';

import { CircularProgress } from '@material-ui/core';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

/**
 * @param {Object} props
 * @param {string} props.url the url to display in the iframe
 * @param {string} props.title the title of the iframe (not displayed)
 * @param {string} props.className the class name to apply to the parent div element
 */
const IFrameLink = ({
  url, title, className, ...opt
}) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`iframe-link ${className}`}>
      {isLoading && (<CircularProgress className="iframe-link__loader" />)}
      <a className="iframe-link__link" href={url} rel="noopener noreferrer" target="_blank">
        <iframe
          frameBorder="0"
          marginHeight="0"
          marginWidth="0"
          width="100%"
          {...opt}
          onLoad={() => setIsLoading(false)}
          scrolling="no"
          src={url}
          title={title}
        />
      </a>
    </div>
  );
};

IFrameLink.propTypes = {
  title: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  className: PropTypes.string,
};


IFrameLink.defaultProps = {
  className: '',
};


export default IFrameLink;
