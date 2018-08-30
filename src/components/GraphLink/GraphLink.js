/**
 * @module /components/GraphLink
 */

import React from 'react';
import PropTypes from 'prop-types';
import './GraphLink.css';
import config from '../../config.json';

const LABEL_BASELINE_SHIFT = 4;
const SELECTED_OPACITY = 1;
const DEFAULT_OPACITY = 0.7;
const FADED_OPACITY = 0.4;
const START_OFFSET = '20%';

const { NODE_RADIUS, ARROW_LENGTH } = config.GRAPH_PROPERTIES;

/**
 * Display component for graph link objects. Rendered as a straight link from a
 * source node to a target. With an arrow marker on the end, hovering just
 * outside the target node bounds.
 */
function GraphLink(props) {
  const {
    link,
    bold,
    faded,
    color,
    labelKey,
    marker,
    handleClick,
  } = props;

  if (link.source === link.target) return null;

  const left = link.source.x < link.target.x;

  let label = '';
  if (labelKey && labelKey.includes('.')) {
    const keys = labelKey.split('.');
    label = link.data[keys[0]][keys[1]];
  } else if (labelKey) {
    label = link.data[labelKey];
  }

  let opacity = DEFAULT_OPACITY;

  if (bold) {
    opacity = SELECTED_OPACITY;
  }
  if (faded) {
    opacity = FADED_OPACITY;
  }

  const dx = link.target.x - link.source.x;
  const dy = link.target.y - link.source.y;

  let angle = 0;

  if (dx === 0) {
    angle = dy > 0 ? Math.PI / 2 : Math.PI * 3 / 2;
  } else if (dy === 0) {
    angle = dx > 0 ? 0 : Math.PI;
  } else {
    angle = Math.atan((dx < 0 ? -dy : dy) / dx);
  }

  const start = {
    x: link.source.x + (dx < 0 ? -1 : 1) * Math.cos(angle) * NODE_RADIUS,
    y: link.source.y + Math.sin(angle) * NODE_RADIUS,
  };
  const end = {
    x: link.target.x - (dx < 0 ? -1 : 1) * Math.cos(angle) * (NODE_RADIUS + 3 * ARROW_LENGTH),
    y: link.target.y - Math.sin(angle) * (NODE_RADIUS + 3 * ARROW_LENGTH),
  };

  return (
    <g>
      <path
        className="link-widen"
        d={`M${start.x || 0} ${start.y || 0}L${end.x || 0} ${end.y || 0}`}
        onClick={handleClick}
      />
      <path
        className="link"
        id={`link${link.data['@rid']}`}
        d={`M${start.x || 0} ${start.y || 0}L${end.x || 0} ${end.y || 0}`}
        markerEnd={marker}
        style={{ opacity, strokeOpacity: opacity }}
        fill={color}
        stroke={color}
        onClick={handleClick}
      />
      {labelKey && (
        <text
          fill={color}
          opacity={opacity}
          onClick={handleClick}
          className="link-label"
        >
          <textPath
            href={`#link${link.data['@rid']}`}
            startOffset={START_OFFSET}
            side={left ? 'left' : 'right'}
            baselineShift={LABEL_BASELINE_SHIFT}
          >
            {label}
          </textPath>
        </text>
      )}
    </g>
  );
}

GraphLink.propTypes = {
  /**
   * @param {Object} link - Graph link object.
   */
  link: PropTypes.object.isRequired,
  /**
   * @param {boolean} faded - Flag for fading link.
   */
  faded: PropTypes.bool,
  /**
   * @param {string} labelKey - property to label link by.
   */
  labelKey: PropTypes.string,
  /**
   * @param {string} color - color of link. CSS color syntax(es).
   */
  color: PropTypes.string,
  /**
   * @param {function} handleClick - handler for clicking link.
   */
  handleClick: PropTypes.func,
  /**
   * @param {boolean} bold - Flag for boldening link.
   */
  bold: PropTypes.bool,
  /**
   * @param {string} marker - SVG end marker identifier.
   */
  marker: PropTypes.string,
};

GraphLink.defaultProps = {
  faded: false,
  bold: false,
  labelKey: null,
  color: '#999',
  handleClick: null,
  marker: '',
};

export default GraphLink;
