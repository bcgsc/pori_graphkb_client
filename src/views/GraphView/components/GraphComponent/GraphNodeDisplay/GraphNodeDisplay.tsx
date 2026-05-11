import './GraphNodeDisplay.scss';

import { GraphRecord, schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import * as d3Drag from 'd3-drag';
import * as d3Select from 'd3-selection';
import React, { useEffect, useRef } from 'react';

import schema from '@/services/schema';
import config from '@/static/config';

import { GraphNode } from '../kbgraph';

const { NODE_RADIUS } = config.GRAPH_PROPERTIES;
const DEFAULT_OPACITY = 1;
const FADED_OPACITY = 0.6;

interface GraphNodeDisplayProps {
  /** Node decorator object. */
  actionsNode?: GraphNode;
  /** Function to apply drag functionality to node. */
  applyDrag?: (node: GraphNode, evt: d3Drag.D3DragEvent<Element, unknown, unknown>) => void
  /** Color of node. */
  color?: string;
  /** Node currently opened in detail drawer. */
  detail?: Record<string, unknown> | null;
  /** current filter string value. */
  filter?: string;
  /** Parent method on node click event. */
  handleClick?: (...args: unknown[]) => unknown;
  /** Property to label node by. */
  labelKey?: string;
  /** Node to be rendered. */
  node: GraphNode;
}

/**
 * Component used to display graph nodes and apply draggable behavior to them
 * through d3.
 */
function GraphNodeDisplay(props: GraphNodeDisplayProps) {
  const {
    applyDrag,
    handleClick,
    color = '#26328C',
    labelKey = 'name',
    node = null,
    actionsNode,
    detail,
    filter = '',
  } = props;

  const nodeSVG = useRef<SVGGElement>(null);

  // enables svg dragging,calls applyDrag to set dragged position as new position
  useEffect(() => {
    const currentSvg = nodeSVG.current;

    if (applyDrag && node instanceof GraphNode) {
      const nodeElement = d3Select.select(currentSvg as Element);
      nodeElement.call(d3Drag.drag()
        .on('start', (evt) => applyDrag(node, evt)));
    }

    return () => {
      const nodeElement = d3Select.select(currentSvg as Element);
      nodeElement.call(d3Drag.drag()
        .on('start', null));
    };
  }, [applyDrag, node]);

  if (!node) return null;
  let label;

  if (labelKey === 'preview') {
    label = schemaDefn.getPreview(node.data as GraphRecord);
  } else if (labelKey) {
    label = node.getLabel(labelKey);

    if (typeof label === 'object') {
      label = schema.getLabel(label);
    }
  }

  let faded;

  if (node instanceof GraphNode) {
    faded = (detail && detail['@rid'] !== node.getId())
      || (actionsNode && actionsNode.getId() !== node.getId())
      || (filter && !label.includes(filter.toLowerCase()));
  }

  let opacity = DEFAULT_OPACITY;

  if (faded) {
    opacity = FADED_OPACITY;
  }

  const id = node.getId();

  return (
    <g
      ref={nodeSVG}
      transform={`translate(${(node.x || 0)},${(node.y || 0)})`}
    >
      <text
        style={{
          opacity,
        }}
      >
        <tspan className="node-name" dy={28} id={`node-${id}-label`}>
          {label}
        </tspan>
      </text>
      <circle
        cx={0}
        cy={0}
        fill="#fff"
        onClick={handleClick}
        r={NODE_RADIUS}
      />
      <circle
        aria-labelledby={`node-${id}-label`}
        className="node"
        cx={0}
        cy={0}
        fill={color}
        onClick={handleClick}
        r={NODE_RADIUS}
        role="button"
        style={{
          opacity,
        }}
      />
    </g>
  );
}

export default GraphNodeDisplay;
