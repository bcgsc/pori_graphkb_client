import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import './SVGNode.css';
import * as d3 from 'd3';

class SVGNode extends PureComponent {
  componentDidMount() {
    const { node } = this.props;
    const nodeElement = d3.select(this.node);
    nodeElement.call(d3.drag()
      .on('start', () => this.dragstarted(node)));
  }

  componentWillUnmount() {
    const nodeElement = d3.select(this.node);
    nodeElement.call(d3.drag()
      .on('start', null));
  }

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
    } = this.props;

    return (
      <g ref={(n) => { this.node = n; }} onClick={handleClick} transform={`translate(${(node.x || 0)},${(node.y || 0)})`}>
        <circle
          className={expandable ? 'node-expandable' : 'node'}
          fill={color}
          cx={0}
          cy={0}
          r={r}
        />
        <text>
          <tspan className="node-name" dy={12}>
            {node.data.name}
          </tspan>
        </text>
      </g>
    );
  }
}

SVGNode.defaultProps = {
  handleClick: null,
  expandable: false,
  color: '#000',
  r: 4,
};

SVGNode.propTypes = {
  node: PropTypes.object.isRequired,
  handleClick: PropTypes.func,
  expandable: PropTypes.bool,
  color: PropTypes.string,
  r: PropTypes.number,
  simulation: PropTypes.object.isRequired,
};

export default SVGNode;
