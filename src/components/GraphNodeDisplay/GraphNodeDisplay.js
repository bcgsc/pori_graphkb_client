/**
 * @module /components/GraphNodeDisplay
 */

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import './GraphNodeDisplay.css';
import * as d3 from 'd3';
import config from '../../config.json';

const { NODE_RADIUS } = config.GRAPH_PROPERTIES;
const DEFAULT_OPACITY = 1;
const FADED_OPACITY = 0.6;

/**
 * Component used to display graph nodes and apply draggable behavior to them
 * through d3.
 */
class GraphNodeDisplay extends PureComponent {
  /**
   * Initializes node element and applies drag behavior to it.
   */
  componentDidMount() {
    const { node, applyDrag } = this.props;
    if (applyDrag) {
      const nodeElement = d3.select(this.node);
      nodeElement.call(d3.drag()
        .on('start', () => applyDrag(node)));
    }
  }

  /**
   * Removes d3 listener from object.
   */
  componentWillUnmount() {
    const nodeElement = d3.select(this.node);
    nodeElement.call(d3.drag()
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
    } = this.props;

    const label = node.getLabel(labelKey);

    const faded = (detail && detail['@rid'] !== node.data['@rid'])
      || (actionsNode && actionsNode.data['@rid'] !== node.data['@rid'])
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

/**
 * @namespace
 * @property {Object} node - Node to be rendered.
 * @property {function} handleClick - Parent method on node click event.
 * @property {string} color - Color of node.
 * @property {function} applyDrag - Function to apply drag functionality to node.
 * @property {string} labelKey - Property to label node by.
 * @property {Object} actionsNode - Node decorator object.
 * @property {Object} detail - Node currently opened in detail drawer.
 * @property {string} filter - current filter string value.
 */
GraphNodeDisplay.propTypes = {
  node: PropTypes.object.isRequired,
  handleClick: PropTypes.func,
  color: PropTypes.string,
  applyDrag: PropTypes.func,
  labelKey: PropTypes.string,
  actionsNode: PropTypes.object,
  detail: PropTypes.object,
  filter: PropTypes.string,
};

GraphNodeDisplay.defaultProps = {
  handleClick: null,
  color: '#26328C',
  labelKey: 'name',
  actionsNode: null,
  applyDrag: null,
  detail: null,
  filter: '',
};


export default GraphNodeDisplay;
