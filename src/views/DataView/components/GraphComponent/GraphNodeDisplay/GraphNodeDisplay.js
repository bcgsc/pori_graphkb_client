/**
 * @module /components/GraphNodeDisplay
 */

import './GraphNodeDisplay.scss';

import * as d3Drag from 'd3-drag';
import * as d3Select from 'd3-selection';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';

import schema from '@/services/schema';
import config from '@/static/config';

import { GraphNode } from '../kbgraph';

const { NODE_RADIUS } = config.GRAPH_PROPERTIES;
const DEFAULT_OPACITY = 1;
const FADED_OPACITY = 0.6;

/**
 * Component used to display graph nodes and apply draggable behavior to them
 * through d3.
 *
 * @property {object} props
 * @property {Object} props.node - Node to be rendered.
 * @property {function} props.handleClick - Parent method on node click event.
 * @property {string} props.color - Color of node.
 * @property {function} props.applyDrag - Function to apply drag functionality to node.
 * @property {string} props.labelKey - Property to label node by.
 * @property {Object} props.actionsNode - Node decorator object.
 * @property {Object} props.detail - Node currently opened in detail drawer.
 * @property {string} props.filter - current filter string value.
 */
function GraphNodeDisplay(props) {
  const {
    applyDrag,
    handleClick,
    color,
    labelKey,
    node,
    actionsNode,
    detail,
    filter,
  } = props;

  const nodeSVG = useRef(null);

  useEffect(() => {
    if (applyDrag) {
      const nodeElement = d3Select.select(nodeSVG.current);
      nodeElement.call(d3Drag.drag()
        .on('start', () => applyDrag(node)));
    }

    return () => {
      const nodeElement = d3Select.select(nodeSVG.current);
      nodeElement.call(d3Drag.drag()
        .on('start', null));
    };
  }, [applyDrag, node]);

  if (!node) return null;
  let label;

  if (labelKey === 'preview') {
    label = schema.getPreview(node.data);
  } else {
    label = node instanceof GraphNode ? node.getLabel(labelKey) : node.data[labelKey];

    if (typeof label === 'object') {
      label = schema.getLabel(label, true);
    }
  }

  const faded = (detail && detail['@rid'] !== node.getId())
      || (actionsNode && actionsNode.getId() !== node.getId())
      || (filter && !label.includes(filter.toLowerCase()));

  let opacity = DEFAULT_OPACITY;

  if (faded) {
    opacity = FADED_OPACITY;
  }

  return (
    <g
      ref={(n) => { nodeSVG.current = n; }}
      transform={`translate(${(node.x || 0)},${(node.y || 0)})`}
    >
      <text
        style={{
          opacity,
        }}
      >
        <tspan className="node-name" dy={28}>
          {label}
        </tspan>
      </text>
      <circle
        fill="#fff"
        cx={0}
        cy={0}
        r={NODE_RADIUS}
      />
      <circle
        style={{
          opacity,
        }}
        onClick={handleClick}
        className="node"
        fill={color}
        cx={0}
        cy={0}
        r={NODE_RADIUS}
      />
    </g>
  );
}

GraphNodeDisplay.propTypes = {
  node: PropTypes.object,
  handleClick: PropTypes.func,
  color: PropTypes.string,
  applyDrag: PropTypes.func,
  labelKey: PropTypes.string,
  actionsNode: PropTypes.object,
  detail: PropTypes.object,
  filter: PropTypes.string,
};

GraphNodeDisplay.defaultProps = {
  node: null,
  handleClick: null,
  color: '#26328C',
  labelKey: 'name',
  actionsNode: null,
  applyDrag: null,
  detail: null,
  filter: '',
};

export default GraphNodeDisplay;
