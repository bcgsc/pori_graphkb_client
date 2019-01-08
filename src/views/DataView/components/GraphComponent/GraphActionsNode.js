/**
 * @module /components/GraphActionsNode
 */
import React from 'react';
import PropTypes from 'prop-types';

import config from '../../../../static/config';

const {
  DETAILS_RING_RADIUS,
  NODE_RADIUS,
  FONT_SIZE,
  LABEL_V_MARGIN,
  ICON_DIMS,
} = config.GRAPH_PROPERTIES;

const ICON_POSITION_COEFFICIENT = 0.64;
const SCALE = 0.8;
const OPACITY = 0.9;
const ICON_MAP = {
  details: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
  hide: 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z',
  close: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  expand: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z',
};

/**
 * Component for displaying ring-shaped panel containing possible actions for
 * selected node. This component handles geometry and rendering ONLY.
 */
function GraphActionsNode(props) {
  const {
    options,
    actionsNode,
    edge,
  } = props;

  if (!actionsNode) return null;

  const translateX = edge
    ? (actionsNode.target.x + actionsNode.source.x) / 2
    : (actionsNode.x || 0);
  const translateY = edge
    ? (actionsNode.target.y + actionsNode.source.y) / 2
    : (actionsNode.y);

  const actionsRing = [];
  options.forEach((option, i) => {
    const l = options.length;
    const offset = 1 / l * Math.PI;
    const startAngle = (i + 1) / l * 2 * Math.PI + offset;
    const endAngle = i / l * 2 * Math.PI + offset;

    const start = {
      x: DETAILS_RING_RADIUS * Math.cos(startAngle),
      y: DETAILS_RING_RADIUS * Math.sin(startAngle),
    };
    const end = {
      x: DETAILS_RING_RADIUS * Math.cos(endAngle),
      y: DETAILS_RING_RADIUS * Math.sin(endAngle),
    };

    const innerRadius = edge ? 8 : NODE_RADIUS;
    const innerEnd = {
      x: innerRadius * Math.cos(startAngle),
      y: innerRadius * Math.sin(startAngle),
    };
    const innerStart = {
      x: innerRadius * Math.cos(endAngle),
      y: innerRadius * Math.sin(endAngle),
    };

    const d = [
      'M', start.x, start.y,
      'A', DETAILS_RING_RADIUS, DETAILS_RING_RADIUS, 0, 0, 0, end.x, end.y,
      'L', innerStart.x, innerStart.y,
      'A', innerRadius, innerRadius, 0, 0, 1, innerEnd.x, innerEnd.y,
      'L', start.x, start.y,
    ].join(' ');

    const angle = (2 * i + 1) / l * Math.PI + offset;
    const dx = DETAILS_RING_RADIUS * Math.cos(angle) * ICON_POSITION_COEFFICIENT;
    const dy = DETAILS_RING_RADIUS * Math.sin(angle) * ICON_POSITION_COEFFICIENT;

    actionsRing.push((
      <g
        style={{ cursor: 'pointer' }}
        onClick={option.action}
        key={option.name}
        id={option.name.toLowerCase()}
      >
        <path
          d={d}
          fill={`rgba(255,255,255,${OPACITY})`}
          stroke="#ccc"
        />
        <g
          transform={`translate(${dx - ICON_DIMS * SCALE / 2}, ${dy - ICON_DIMS * SCALE / 2}) scale(${SCALE})`}
          fill={option.disabled && option.disabled(actionsNode) ? '#ccc' : '#555'}
        >
          <path d={ICON_MAP[option.name.toLowerCase()]} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={FONT_SIZE}
            dy={ICON_DIMS + LABEL_V_MARGIN} // add small margin vertically
            dx={ICON_DIMS / 2} // center label horizontally
          >
            {`(${option.name})`}
          </text>
        </g>
      </g>
    ));
  });

  return (
    <g transform={`translate(${translateX},${translateY})`} className="actions-node">
      {actionsRing}
    </g>
  );
}

/**
 * @namespace
 * @property {array} options - List of options, each must be in the form:
 *    option: {
 *      name: [string]
 *      action: [(any) => any]
 *      disabled?: [(any) => boolean}
 *    }
 * @property {Object} actionsNode - Currently selected object.
 * @property {boolean} edge - yes/no flag determining whether selected object is
 * an edge or not
 */
GraphActionsNode.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    action: PropTypes.func,
    disabled: PropTypes.func,
  })),
  actionsNode: PropTypes.object,
  edge: PropTypes.bool,
};

GraphActionsNode.defaultProps = {
  options: [],
  actionsNode: null,
  edge: false,
};


export default GraphActionsNode;
