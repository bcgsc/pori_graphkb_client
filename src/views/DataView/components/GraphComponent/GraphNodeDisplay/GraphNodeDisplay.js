/**
 * @module /components/GraphNodeDisplay
 */

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import * as d3Select from 'd3-selection';
import * as d3Drag from 'd3-drag';

import './GraphNodeDisplay.scss';
import config from '../../../../../static/config';
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
 * @property {Object} props.schema - Knowledgebase Schema object.
 */
class GraphNodeDisplay extends PureComponent {
  static propTypes = {
    node: PropTypes.object,
    handleClick: PropTypes.func,
    color: PropTypes.string,
    applyDrag: PropTypes.func,
    labelKey: PropTypes.string,
    actionsNode: PropTypes.object,
    detail: PropTypes.object,
    filter: PropTypes.string,
    schema: PropTypes.object,
  };

  static defaultProps = {
    node: null,
    handleClick: null,
    color: '#26328C',
    labelKey: 'name',
    actionsNode: null,
    applyDrag: null,
    detail: null,
    filter: '',
    schema: null,
  };

  /**
   * Initializes node element and applies drag behavior to it.
   */
  componentDidMount() {
    const { node, applyDrag } = this.props;

    if (applyDrag) {
      const nodeElement = d3Select.select(this.node);
      nodeElement.call(d3Drag.drag()
        .on('start', () => applyDrag(node)));
    }
  }

  /**
   * Removes d3 listener from object.
   */
  componentWillUnmount() {
    const nodeElement = d3Select.select(this.node);
    nodeElement.call(d3Drag.drag()
      .on('start', null));
  }

  render() {
    const {
      node,
      handleClick,
      color,
      labelKey,
      actionsNode,
      detail,
      filter,
      schema,
    } = this.props;

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
        ref={(n) => { this.node = n; }}
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
}

export default GraphNodeDisplay;
