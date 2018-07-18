import React from 'react';
import PropTypes from 'prop-types';
import './SVGLink.css';

/**
 * Display component for graph link objects.
 * @param {Object} props.link - Graph link object to be displayed.
 */
function SVGLink(props) {
  const { link } = props;

  return (
    <g>
      <path
        className="link"
        d={`M${(link.source.x || 0)} ${(link.source.y || 0)}L${(link.target.x || 0)} ${(link.target.y || 0)}`}
        markerEnd="url(#endArrow)"
      />
    </g>
  );
}

SVGLink.propTypes = {
  link: PropTypes.object.isRequired,
};

export default SVGLink;
