import React, { Component } from 'react';
import './GraphComponent.css';
import * as d3 from 'd3';
import ReactDOM from 'react-dom';
import SVGLink from '../SVGLink/SVGLink';
import SVGNode from '../SVGNode/SVGNode';
import api from '../../services/api';

const childR = 105;
const parentR = 55;
// const aliasR = 75;

class GraphComponent extends Component {
    constructor(props) {
        super(props);

        this.state = {
            nodes: [],
            links: [],
            linkStrength: props.linkStrength,
            simulation: d3.forceSimulation(),
            svg: undefined,
            node: this.props.node,
            selectedChildren: [],
            selectedParents: [],
            selectedAliases: [],
            selectedNeighbors: [],
        }

        this.drawChart = this.drawChart.bind(this);
        this.initSimulation = this.initSimulation.bind(this);
        this.getNeighbors = this.getNeighbors.bind(this);
        console.log(props.selectedColor)
    }

    componentDidMount() {
        this.initSimulation();
        const nodes = this.state.nodes;
        nodes.push({
            name: this.props.node.name,
            rid: this.props.node.rid,
            index: 0,
        });
        this.setState({ nodes }, this.getNeighbors(this.props.node.rid.slice(1), 0, { x: 0, y: 0 }))

        window.addEventListener('resize', this.initSimulation);
    }

    getNeighbors(rid, index, position) {
        const nodes = this.state.nodes;
        const links = this.state.links;
        const selectedChildren = [];
        const selectedParents = [];
        const selectedAliases = [];

        let url = '/diseases/' + rid + '?neighbors=2';
        api.get(url).then(data => {

            if (data['out_SubClassOf']) { //parents
                let n = data['out_SubClassOf'].length;
                let j = 0;
                data['out_SubClassOf'].forEach(edge => {
                    selectedParents.push(edge.in['@rid']);
                    if (nodes.filter(n => n.rid === edge.in['@rid']).length !== 0) return;
                    let i = nodes.length;

                    let pos = this.positionInit(position.x, position.y, j++, n, parentR);

                    nodes.push({
                        name: edge.in.name,
                        rid: edge.in['@rid'],
                        index: i,
                        x: pos.x,
                        y: pos.y,
                    });
                    links.push({ source: index, target: i });
                    console.log(nodes);
                });
            }
            if (data['in_SubClassOf']) { //children
                let n = data['in_SubClassOf'].length;
                let j = 0;
                data['in_SubClassOf'].forEach(edge => {
                    selectedChildren.push(edge.out['@rid']);
                    if (nodes.filter(n => n.rid === edge.out['@rid']).length !== 0) return;

                    let i = nodes.length;
                    let pos = this.positionInit(position.x, position.y, j++, n, childR);
                    nodes.push({
                        name: edge['out'].name,
                        rid: edge.out['@rid'],
                        index: i,
                        x: pos.x,
                        y: pos.y,
                    });
                    links.push({ source: i, target: index });
                });
            }
            if (data['out_AliasOf']) {
                data['out_AliasOf'].forEach(edge => {
                    selectedAliases.push(edge.in['@rid']);
                    if (nodes.filter(n => n.rid === edge.in['@rid']).length !== 0) return;
                    let i = nodes.length;

                    nodes.push({
                        name: edge['in'].name,
                        rid: edge.in['@rid'],
                        index: i,
                        type: 'alias'
                    });
                    links.push({ source: index, target: i, type: 'alias' });
                });
            }
            if (data['in_AliasOf']) {
                // let n = data['in_AliasOf'].length;
                data['in_AliasOf'].forEach(edge => {
                    selectedAliases.push(edge.out['@rid']);
                    if (nodes.filter(n => n.rid === edge.out['@rid']).length !== 0) return;
                    let i = nodes.length;
                    nodes.push({
                        name: edge.out.name,
                        rid: edge.out['@rid'],
                        index: i,
                    });
                    links.push({ source: i, target: index, type: 'alias' })
                });
            }

            this.setState({
                nodes,
                links,
                selectedId: data['@rid'],
                expandId: data['@rid'],
                selectedAliases,
                selectedChildren,
                selectedParents,
            }, this.drawChart(nodes, links));
        });
    }



    componentWillUnmount() {
        //remove all event listeners
        this.state.svg.call(d3.zoom().on('zoom', null));
        this.state.simulation.on('tick', null);
        window.removeEventListener('resize', this.initSimulation);
    }

    initSimulation() {
        let simulation = this.state.simulation
            .force("link", d3.forceLink().id(d => d.index))
            .force("collide", d3.forceCollide(d => d.r)) //Can change this to make nodes more readable
            .force("charge", d3.forceManyBody().strength(-175))
            .force("center", d3.forceCenter(this.props.width / 2, this.props.height / 2));

        let container = d3.select(ReactDOM.findDOMNode(this.refs.zoom))

        let svg = d3.select(ReactDOM.findDOMNode(this.refs.graph));
        svg.attr('width', this.props.width).attr('height', this.props.height);

        svg.call(d3.zoom().on('zoom', () => {
            const transform = d3.event.transform;
            container.attr("transform", "translate(" + transform.x + "," + transform.y + ")scale(" + transform.k + ")");
        }));

        this.setState({ simulation: simulation, svg: svg });
    }

    drawChart(nodes, links) {
        const simulation = this.state.simulation;

        simulation.nodes(nodes);

        simulation.force('links', d3.forceLink(links)
            .strength(this.state.linkStrength));

        var ticked = () => {
            this.setState({
                links: links,
                nodes: nodes,
            });
        }

        simulation.on("tick", ticked);
        simulation.restart();
        this.setState({ simulation: simulation });
    }

    positionInit(x, y, i, n, R) {
        x = R * Math.cos(2 * Math.PI * i / n) + x;
        y = R * Math.sin(2 * Math.PI * i / n) + y;
        return { x: x, y: y }
    }

    handleClick(e, node) {
        console.log(node);
        if (node.rid !== this.state.expandId) {
            this.setState({ expandId: node.rid });
            return;
        }
        e.stopPropagation();
        this.getNeighbors(node.rid.slice(1), node.index, { x: node.x, y: node.y });
    }

    render() {
        let links = this.state.links.map(link => {
            return (
                <SVGLink key={link.index}
                    link={link}
                />
            )
        });
        let nodes = this.state.nodes.map(node => {
            const color =
                this.state.selectedId === node.rid ? this.props.selectedColor :
                    this.state.selectedChildren.includes(node.rid) ? this.props.childrenColor :
                        this.state.selectedParents.includes(node.rid) ? this.props.parentsColor :
                            this.state.selectedAliases.includes(node.rid) ? this.props.aliasesColor :
                                '#1F265B';
            return (
                <SVGNode key={'node' + node.rid}
                    node={node}
                    simulation={this.state.simulation}
                    color={color}
                    r={node.rid === this.state.expandId ? 16 : 8}
                    handleClick={(e) => this.handleClick(e, node)}
                />
            )
        });

        return (
            <svg ref='graph'>
                <defs>
                    <marker id="arrow" markerWidth="25" markerHeight="10" refX="11" refY="2" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,4 L6,2 z" fill="#555"></path>
                    </marker>

                    <marker id="darrow" markerWidth="25" markerHeight="10" refX="-5" refY="2" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,2 L6,4 L 6,0 z" fill="#555"></path>
                    </marker>
                </defs>
                <g ref='zoom'>
                    {links}
                    {nodes}
                </g>
            </svg>
        )
    }
}
export default GraphComponent;
