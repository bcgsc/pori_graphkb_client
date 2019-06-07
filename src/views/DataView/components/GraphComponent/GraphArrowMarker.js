import React from 'react';

import config from '../../../../static/config';

// Component specific constants.
const MARKER_ID = 'endArrow';
const {
  ARROW_WIDTH,
  ARROW_LENGTH,
} = config.GRAPH_PROPERTIES;

function GraphArrowMarker() {
  console.log('GraphArrowMarker called...')
  return (
    <marker
      id={MARKER_ID}
      viewBox={`0 0 ${ARROW_LENGTH} ${ARROW_WIDTH}`}
      refY={ARROW_WIDTH / 2}
      markerUnits="strokeWidth"
      markerWidth="4"
      markerHeight="4"
      orient="auto"
    >
      <path d={`M 0 0 L ${ARROW_LENGTH} ${ARROW_WIDTH / 2} L 0 ${ARROW_WIDTH} z`} fill="#555" />
    </marker>
  );
}

export default GraphArrowMarker;
