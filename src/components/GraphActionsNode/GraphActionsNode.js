import React from 'react';
import PropTypes from 'prop-types';
import config from '../../config.json';

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

/**
 * Component for displaying ring-shaped panel containing possible actions for selected node.
 */
function GraphActionsNode(props) {
  const {
    options,
    handleActionsRing,
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
        onClick={() => handleActionsRing(option.action)}
        key={d}
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
          {(option || '').icon}
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
    <g transform={`translate(${translateX},${translateY})`}>
      {actionsRing}
    </g>
  );
}

/**
 * @param {array} options - List of options, each must be in the form:
 *    option: {
 *      name: [string]
 *      icon: [svg element]
 *      action: [(any) => any]
 *      disabled?: [(any) => boolean}
 *    }
 * @param {function} handleActionsRing - Parent method on actions ring click event.
 * @param {object} actionsNode - Currently selected node.
 */
GraphActionsNode.propTypes = {
  options: PropTypes.array,
  handleActionsRing: PropTypes.func,
  actionsNode: PropTypes.object,
  edge: PropTypes.bool,
};

GraphActionsNode.defaultProps = {
  options: [],
  handleActionsRing: null,
  actionsNode: null,
  edge: false,
};


export default GraphActionsNode;
