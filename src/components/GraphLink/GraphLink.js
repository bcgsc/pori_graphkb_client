import React from 'react';
import PropTypes from 'prop-types';
import './GraphLink.css';

const LABEL_BASELINE_SHIFT = 4;

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
    actionsNode,
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

  let opacity = 0.7;
  if (detail) {
    if (detail['@rid'] === link.data['@rid']) {
      opacity = 1;
    } else {
      opacity = 0.4;
    }
  }
  return (
    <g>
      <path
        className="link-widen"
        d={`M${(link.source.x || 0)} ${(link.source.y || 0)}L${(link.target.x || 0)} ${(link.target.y || 0)}`}
        onClick={handleClick}
      />
      <path
        className="link"
        id={`link${link.data['@rid']}`}
        d={`M${(link.source.x || 0)} ${(link.source.y || 0)}L${(link.target.x || 0)} ${(link.target.y || 0)}`}
        markerEnd={marker}
        style={{ opacity, strokeOpacity: opacity }}
        fill={color}
        stroke={color}
        onClick={handleClick}
      />
      {labelKey ? (
        <text fill={color} opacity={opacity}>
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
      {actionsNode}
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
  actionsNode: PropTypes.object,
};

GraphLink.defaultProps = {
  detail: null,
  labelKey: null,
  color: '#999',
  handleClick: null,
  actionsNode: null,
};

export default GraphLink;
