/**
 * @module /components/GraphLinkDisplay
 */

import './GraphLinkDisplay.scss';

import React from 'react';

import config from '@/static/config';

const LABEL_BASELINE_SHIFT = 4;
const SELECTED_OPACITY = 1;
const DEFAULT_OPACITY = 0.7;
const FADED_OPACITY = 0.4;
const START_OFFSET = '20%';

const { NODE_RADIUS, ARROW_LENGTH } = config.GRAPH_PROPERTIES;
interface GraphLinkDisplayProps {
  /** Graph link object. */
  link: object;
  /** Node decorator object. */
  actionsNode?: object;
  /**
   * color of link. CSS color syntax(es).
   * @default '#999'
   */
  color?: string;
  /** Node currently opened in detail drawer. */
  detail?: object;
  /** current filter string value. */
  filter?: string;
  /** handler for clicking link. */
  handleClick?: React.MouseEventHandler<SVGPathElement | SVGTextElement>;
  /** property to label link by. */
  labelKey?: string;
  /** SVG end marker identifier. */
  marker?: string;
}

/**
  * Display component for graph link objects. Rendered as a straight link from a
  * source node to a target. With an arrow marker on the end, hovering just
  * outside the target node bounds.
  */
function GraphLinkDisplay(props: GraphLinkDisplayProps) {
  const {
    link,
    color,
    labelKey,
    marker,
    handleClick,
    detail,
    actionsNode,
    filter,
  } = props;

  if (link.source === link.target) return null;

  const left = link.source.x < link.target.x;

  let label = '';

  if (labelKey && labelKey.includes('.')) {
    const keys = labelKey.split('.');

    if (link.data[keys[0]] === undefined) {
      label = '';
    } else {
      label = link.data[keys[0]][keys[1]];
    }
  } else if (labelKey) {
    label = link.data[labelKey];
  }

  const faded = (detail && detail['@rid'] !== link.data['@rid'])
     || (actionsNode && actionsNode.data['@rid'] !== link.data['@rid'])
     || (filter && !label.includes(filter.toLowerCase()));
  const bold = (detail && detail['@rid'] === link.data['@rid'])
     || (actionsNode && actionsNode.data['@rid'] === link.data['@rid'])
     || (filter && label.includes(filter.toLowerCase()));

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
    angle = dy > 0 ? Math.PI / 2 : (Math.PI * 3) / 2;
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
        d={`M${start.x || 0} ${start.y || 0}L${end.x || 0} ${end.y || 0}`}
        fill={color}
        id={`link${link.data['@rid']}`}
        markerEnd={marker}
        onClick={handleClick}
        stroke={color}
        style={{ opacity, strokeOpacity: opacity }}
      />
      {labelKey && (
      <text
        className="link-label"
        fill={color}
        onClick={handleClick}
        opacity={opacity}
      >
        <textPath
          baselineShift={LABEL_BASELINE_SHIFT}
          href={`#link${link.data['@rid']}`}
          side={left ? 'left' : 'right'}
          startOffset={START_OFFSET}
        >
          {label}
        </textPath>
      </text>
      )}
    </g>
  );
}

GraphLinkDisplay.defaultProps = {
  detail: null,
  actionsNode: null,
  labelKey: null,
  color: '#999',
  handleClick: null,
  marker: '',
  filter: '',
};

export default GraphLinkDisplay;
