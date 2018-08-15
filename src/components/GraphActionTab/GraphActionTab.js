import React from 'react';
import PropTypes from 'prop-types';
import config from '../../config.json';

const WIDTH = 38;
const OVERHANG = 10;
const ARROW_HEIGHT = 18;
const HEIGHT = 36;

const {
  ICON_DIMS,
  FONT_SIZE,
  LABEL_V_MARGIN,
} = config.GRAPH_PROPERTIES;

/**
 * Component for displaying ring-shaped panel containing possible actions for selected node.
 */
function GraphActionTab(props) {
  const {
    option,
    actionsNode,
  } = props;
  if (!actionsNode) return null;

  const { target, source } = actionsNode;
  if (!target || !source) return null;

  const { name, icon, action, disabled } = option;
  if (!disabled(actionsNode)) {
    return (
      <g
        transform={`translate(${(target.x + source.x) / 2 - WIDTH / 2}, ${(target.y + source.y) / 2})`}
        onClick={action}
        style={{
          cursor: 'pointer',
        }}
      >
        <path
          stroke="#ccc"
          fill="rgba(255,255,255,0.8)"
          d={`M${WIDTH / 2} 0L${OVERHANG} ${ARROW_HEIGHT}H${0}V${ARROW_HEIGHT + HEIGHT}H${WIDTH}V${ARROW_HEIGHT}H${WIDTH - OVERHANG}L${WIDTH / 2} 0Z`}
        />
        <g
          fill="#555"
          transform={`translate(${WIDTH / 2 - ICON_DIMS / 2},${ARROW_HEIGHT + 3})`}
        >
          {icon}
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={FONT_SIZE}
            dy={ICON_DIMS + LABEL_V_MARGIN} // add small margin vertically
            dx={ICON_DIMS / 2} // center label horizontally
          >
            {`(${name})`}
          </text>
        </g>
      </g>
    );
  } return null;
}

/**
 * @param {function} handleClick - Parent method on actions ring click event.
 */
GraphActionTab.propTypes = {
  option: PropTypes.object,
  actionsNode: PropTypes.object,
};

GraphActionTab.defaultProps = {
  option: null,
  actionsNode: null,
};

export default GraphActionTab;
