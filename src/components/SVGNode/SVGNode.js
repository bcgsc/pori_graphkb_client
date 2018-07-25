import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import './SVGNode.css';
import * as d3 from 'd3';

/**
 * Component used to display graph nodes and apply draggable behavior to them through d3.
 */
class SVGNode extends PureComponent {
  /**
   * Initializes node element and applies drag behavior to it.
   */
  componentDidMount() {
    const { node } = this.props;
    const nodeElement = d3.select(this.node);
    nodeElement.call(d3.drag()
      .on('start', () => this.dragstarted(node)));
  }

  /**
   * Removes d3 listener from object.
   */
  componentWillUnmount() {
    const nodeElement = d3.select(this.node);
    nodeElement.call(d3.drag()
      .on('start', null));
  }

  /**
   * Applies drag behavior to node.
   * @param {Object} node - node to be dragged.
   */
  dragstarted(node) {
    const { simulation } = this.props;
    d3.event.sourceEvent.stopPropagation();

    if (!d3.event.active) simulation.alphaTarget(0.3).restart();

    /* eslint-disable */
    function dragged() {
      node.fx = d3.event.x;
      node.fy = d3.event.y;
    }

    function ended() {
      if (!d3.event.active) simulation.alphaTarget(0);
      node.fx = null;
      node.fy = null;
    }
    /* eslint-enable */

    d3.event
      .on('drag', dragged)
      // .on("touchmove", dragged)
      .on('end', ended);
    // .on("touchend", ended);
  }

  render() {
    const {
      node,
      handleClick,
      expandable,
      color,
      r,
      actionsRing,
      label,
    } = this.props;

    return (
      <g
        ref={(n) => { this.node = n; }}
        transform={`translate(${(node.x || 0)},${(node.y || 0)})`}
      >
        <text>
          <tspan className="node-name" dy={28}>
            {node.data[label] || ''}
          </tspan>
        </text>
        {actionsRing}
        <circle
          onClick={handleClick}
          className={expandable ? 'node-expandable' : 'node'}
          fill={color}
          cx={0}
          cy={0}
          r={r}
        />
      </g>
    );
  }
}

SVGNode.defaultProps = {
  handleClick: null,
  expandable: false,
  color: '#26328C',
  r: 4,
  actionsRing: null,
  label: 'name',
};

/**
 * @param {Object} node - Node to be rendered.
 * @param {function} handleClick - Parent method on node click event.
 * @param {bool} expandable - Expandable flag.
 * @param {string} color - Color of node.
 * @param {number} r - Node radius.
 * @param {Object} simulation - parent simulation that node is a member of.
 * @param {string} label - property to display as label.
 */
SVGNode.propTypes = {
  node: PropTypes.object.isRequired,
  handleClick: PropTypes.func,
  expandable: PropTypes.bool,
  color: PropTypes.string,
  r: PropTypes.number,
  simulation: PropTypes.object.isRequired,
  actionsRing: PropTypes.array,
  label: PropTypes.string,
};

export default SVGNode;
