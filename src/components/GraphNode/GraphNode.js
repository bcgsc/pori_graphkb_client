/**
 * @module /components/GraphNode
 */

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import './GraphNode.css';
import * as d3 from 'd3';
import config from '../../config.json';

const { NODE_RADIUS } = config.GRAPH_PROPERTIES;
const DEFAULT_OPACITY = 1;
const FADED_OPACITY = 0.6;
const MAX_LABEL_LENGTH = 25;

/**
 * Component used to display graph nodes and apply draggable behavior to them
 * through d3.
 */
class GraphNode extends PureComponent {
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
      faded,
    } = this.props;

    // Extract label
    let obj = node.data;
    let key = labelKey;
    if (labelKey.includes('.')) {
      key = labelKey.split('.')[1];
      obj = node.data[labelKey.split('.')[0]];
    }
    let label = obj && obj[key];
    if (label && label.length > MAX_LABEL_LENGTH) {
      label = `${label.substring(0, MAX_LABEL_LENGTH - 4).trim()}...`;
    }
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

GraphNode.defaultProps = {
  handleClick: null,
  color: '#26328C',
  labelKey: 'name',
  faded: false,
  applyDrag: null,
};

/**
 * @param {bool} expandable - Expandable flag.

 * @param {number} r - Node radius.
 * @param {Object} simulation - parent simulation that node is a member of.
 * @param {Array} actionsRing - Array of svg components making up the node actions ring
 * surrounding a selected node.
 * @param {string} labelKey - property to display as label.
 * @param {Object} detail - node identifier for node who's details are currently displayed.
 */
GraphNode.propTypes = {
  /**
   * @param {Object} node - Node to be rendered.
   */
  node: PropTypes.object.isRequired,
  /**
   * @param {function} handleClick - Parent method on node click event.
   */
  handleClick: PropTypes.func,
  /**
   * @param {string} color - Color of node.
   */
  color: PropTypes.string,
  /**
   * @param {function} applyDrag - Function to apply drag functionality to node.
   */
  applyDrag: PropTypes.func,
  /**
   * @param {string} labelKey - Property to label node by.
   */
  labelKey: PropTypes.string,
  /**
   * @param {boolean} faded - flag for whether or not node is faded.
   */
  faded: PropTypes.bool,
};

export default GraphNode;
