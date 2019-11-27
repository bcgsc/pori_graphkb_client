import React from 'react';

import config from '@/static/config';

// Component specific constants.
const MARKER_ID = 'endArrow';
const {
  ARROW_WIDTH,
  ARROW_LENGTH,
} = config.GRAPH_PROPERTIES;

function GraphArrowMarker() {
  return (
    <marker
      id={MARKER_ID}
      markerHeight="4"
      markerUnits="strokeWidth"
      markerWidth="4"
      orient="auto"
      refY={ARROW_WIDTH / 2}
      viewBox={`0 0 ${ARROW_LENGTH} ${ARROW_WIDTH}`}
    >
      <path d={`M 0 0 L ${ARROW_LENGTH} ${ARROW_WIDTH / 2} L 0 ${ARROW_WIDTH} z`} fill="#555" />
    </marker>
  );
}

export default GraphArrowMarker;
