import React from 'react';
import PropTypes from 'prop-types';
import './GraphLink.css';

const LABEL_BASELINE_SHIFT = 4;
const DEFAULT_OPACITY = 0.7;
const FADED_OPACITY = 0.4;

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
  } = props;

  const left = link.source.x < link.target.x;

  let marker = '';
  if (link.source !== link.target) {
    marker = 'url(#endArrow)';
  }

  let label = '';
  if (labelKey && labelKey.includes('.')) {
    const keys = labelKey.split('.');
    label = link.data[keys[0]][keys[1]];
  } else if (labelKey) {
    label = link.data[labelKey];
  }

  return (
    <g>
      <path
        className="link-widen"
        d={`M${(link.source.x || 0)} ${(link.source.y || 0)}L${(link.target.x || 0)} ${(link.target.y || 0)}`}
      />
      <path
        className="link"
        id={`link${link.data['@rid']}`}
        d={`M${(link.source.x || 0)} ${(link.source.y || 0)}L${(link.target.x || 0)} ${(link.target.y || 0)}`}
        markerEnd={marker}
        style={{
          opacity: detail ? FADED_OPACITY : DEFAULT_OPACITY,
          strokeOpacity: detail ? FADED_OPACITY : DEFAULT_OPACITY,
        }}
        fill={color}
        stroke={color}
      />
      {labelKey ? (
        <text
          fill={color}
          opacity={detail ? FADED_OPACITY : DEFAULT_OPACITY}
          className="link-label"
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
 * @param {bool} linkHighlighting - flag for enabling link highlight on hover.
 */
GraphLink.propTypes = {
  link: PropTypes.object.isRequired,
  detail: PropTypes.string,
  labelKey: PropTypes.string,
  color: PropTypes.string,
};

GraphLink.defaultProps = {
  detail: null,
  labelKey: null,
  color: '#999',
};

export default GraphLink;
