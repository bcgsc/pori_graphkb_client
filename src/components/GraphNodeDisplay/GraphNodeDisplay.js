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
 * @param {bool} expandable - Expandable flag.

 * @param {number} r - Node radius.
 * @param {Object} simulation - parent simulation that node is a member of.
 * @param {Array} actionsRing - Array of svg components making up the node actions ring
 * surrounding a selected node.
 * @param {string} labelKey - property to display as label.
 * @param {Object} detail - node identifier for node who's details are currently displayed.
 */
GraphNodeDisplay.propTypes = {
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
   * @param {Object} actionsNode - Node decorator object.
   */
  actionsNode: PropTypes.object,
  /**
   * @param {Object} detail - Node currently opened in detail drawer.
   */
  detail: PropTypes.object,
  /**
   * @param {string} filter - current filter string value.
   */
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
