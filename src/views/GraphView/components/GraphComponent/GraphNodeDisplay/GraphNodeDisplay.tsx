import './GraphNodeDisplay.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import * as d3Drag from 'd3-drag';
import * as d3Select from 'd3-selection';
import React, { useEffect, useRef } from 'react';

import { GeneralRecordType } from '@/components/types';
import schema from '@/services/schema';
import config from '@/static/config';

import { GraphLink, GraphNode } from '../kbgraph';

const { NODE_RADIUS } = config.GRAPH_PROPERTIES;
const DEFAULT_OPACITY = 1;
const FADED_OPACITY = 0.6;

interface GraphNodeDisplayProps {
  /** Node decorator object. */
  actionsNode: GraphLink | GraphNode | null;
  /** Function to apply drag functionality to node. */
  applyDrag: (node: GraphNode) => void;
  /** Color of node. */
  color: string | undefined;
  /** Node currently opened in detail drawer. */
  detail: GeneralRecordType | null;
  /** Parent method on node click event. */
  handleClick: () => void;
  /** Property to label node by. */
  labelKey: string;
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
    node,
    actionsNode,
    detail,
  } = props;

  const nodeSVG = useRef<SVGGElement | null>(null);

  // enables svg dragging,calls applyDrag to set dragged position as new position
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

  let label;

  if (labelKey === 'preview') {
    label = schemaDefn.getPreview(node.data);
  } else {
    label = node.getLabel(labelKey);

    if (typeof label === 'object') {
      label = schema.getLabel(label);
    }
  }

  const faded = (detail && detail['@rid'] !== node.getId())
      || (actionsNode && actionsNode.getId() !== node.getId());

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
        cx={0}
        cy={0}
        fill="#fff"
        onClick={handleClick}
        r={NODE_RADIUS}
      />
      <circle
        className="node"
        cx={0}
        cy={0}
        fill={color}
        onClick={handleClick}
        r={NODE_RADIUS}
        style={{
          opacity,
        }}
      />
    </g>
  );
}

export default GraphNodeDisplay;
