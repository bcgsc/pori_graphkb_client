import React, { PureComponent } from 'react';
import './SVGNode.css';
import * as d3 from 'd3';
import ReactDOM from 'react-dom';

class SVGNode extends PureComponent {
    componentDidMount() {
        let nodeElement = d3.select(ReactDOM.findDOMNode(this.refs['node' + this.props.node.index]));
        nodeElement.call(d3.drag()
            .on("start", element => this.dragstarted(this.props.node))
            // .on("touchstart", element => dragstarted(node))
        );
    }
    componentWillUnmount() {
        let nodeElement = d3.select(ReactDOM.findDOMNode(this.refs['node' + this.props.node.index]));
        nodeElement.call(d3.drag()
            .on("start", null)
        );
    }

    dragstarted(node) {
        const simulation = this.props.simulation;
        d3.event.sourceEvent.stopPropagation();

        if (!d3.event.active) simulation.alphaTarget(0.3).restart();

        d3.event
            .on("drag", dragged)
            // .on("touchmove", dragged)
            .on("end", ended)
        // .on("touchend", ended);

        function dragged() {
            node.fx = d3.event.x;
            node.fy = d3.event.y;
        }

        function ended() {
            if (!d3.event.active) simulation.alphaTarget(0);
            node.fx = null;
            node.fy = null;
        }
    }

    render() {

        return (
            <g ref={'node' + this.props.node.index} onClick={this.props.handleClick} transform={'translate(' + (this.props.node.x || 0) + ',' + (this.props.node.y || 0) + ')'}>
                <circle className={this.props.expandable ? 'node-expandable' : 'node'}
                    fill={this.props.color}
                    cx={0}
                    cy={0}
                    r={this.props.r}
                />
                <text>
                    <tspan className='node-name' dy={12}>{this.props.node.data.name}</tspan>
                </text>

            </g>
        )
    }
} export default SVGNode