import React from 'react';
import PropTypes from 'prop-types';
import './GraphLink.css';
import config from '../../config.json';

const LABEL_BASELINE_SHIFT = 4;
const DEFAULT_OPACITY = 0.7;
const FADED_OPACITY = 0.4;
const { NODE_RADIUS, ARROW_LENGTH } = config.GRAPH_PROPERTIES;

/**
 * Display component for graph link objects.
 * @param {Object} props.link - Graph link object to be displayed.
 */
function GraphLink(props) {
  const {
    link,
    detail,
    labelKey,
    color,
    handleClick,
  } = props;

  const left = link.source.x < link.target.x;

  const marker = 'url(#endArrow)';
  if (link.source === link.target) return null;

  let label = '';
  if (labelKey && labelKey.includes('.')) {
    const keys = labelKey.split('.');
    label = link.data[keys[0]][keys[1]];
  } else if (labelKey) {
    label = link.data[labelKey];
  }

  let opacity = DEFAULT_OPACITY;
  if (detail) {
    if (detail['@rid'] === link.data['@rid']) {
      opacity = 1;
    } else {
      opacity = FADED_OPACITY;
    }
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
        d={`M${start.x} ${start.y}L${end.x} ${end.y}`}
        onClick={handleClick}
      />
      <path
        className="link"
        id={`link${link.data['@rid']}`}
        d={`M${start.x} ${start.y}L${end.x} ${end.y}`}
        markerEnd={marker}
        style={{ opacity, strokeOpacity: opacity }}
        fill={color}
        stroke={color}
        onClick={handleClick}
      />
      {labelKey ? (
        <text
          fill={color}
          opacity={opacity}
          onClick={handleClick}
        >
          <textPath
            href={`#link${link.data['@rid']}`}
            startOffset="20%"
            side={left ? 'left' : 'right'}
            baselineShift={LABEL_BASELINE_SHIFT}
          >
            {label}
          </textPath>
        </text>
      ) : null}
    </g>
  );
}

/**
 * @param {Object} link - Graph link object.
 * @param {Object} detail - record currently displayed in the detail drawer.
 * @param {bool} linkHighlighting - flag for enabling link highlight on hover.
 */
GraphLink.propTypes = {
  link: PropTypes.object.isRequired,
  detail: PropTypes.object,
  labelKey: PropTypes.string,
  color: PropTypes.string,
  handleClick: PropTypes.func,
};

GraphLink.defaultProps = {
  detail: null,
  labelKey: null,
  color: '#999',
  handleClick: null,
};

export default GraphLink;
