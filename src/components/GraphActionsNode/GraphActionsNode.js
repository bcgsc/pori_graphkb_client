import React from 'react';
import PropTypes from 'prop-types';
import config from '../../config.json';

const {
  DETAILS_RING_RADIUS,
} = config.GRAPH_PROPERTIES;

/**
 * Component for displaying ring-shaped panel containing possible actions for selected node.
 */
function GraphActionsNode(props) {
  const {
    options,
    handleActionsRing,
    actionsNode,
  } = props;

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

    const d = [
      'M', start.x, start.y,
      'A', DETAILS_RING_RADIUS, DETAILS_RING_RADIUS, 0, 0, 0, end.x, end.y,
      'L', 0, 0,
      'L', start.x, start.y,
    ].join(' ');

    const angle = (2 * i + 1) / l * Math.PI + offset;
    const dx = DETAILS_RING_RADIUS * Math.cos(angle);
    const dy = DETAILS_RING_RADIUS * Math.sin(angle);
    const iconDims = 24;
    const scale = 0.8;
    actionsRing.push((
      <g
        style={{ cursor: 'pointer' }}
        onClick={() => handleActionsRing(option.action)}
        key={d}
      >
        <path
          d={d}
          fill="rgba(255,255,255,0.8)"
          stroke="#ccc"
        />
        <g
          transform={`translate(${dx * 0.64 - iconDims * scale / 2}, ${dy * 0.64 - iconDims * scale / 2}) scale(${scale})`}
          fill={option.disabled && option.disabled(actionsNode) ? '#ccc' : '#555'}
        >
          {(option || '').icon}
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={7}
            dy={iconDims + 4}
            dx={iconDims / 2}
          >
            {`(${option.name})`}
          </text>
        </g>
      </g>
    ));
  });

  return actionsRing;
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
};

export default GraphActionsNode;
