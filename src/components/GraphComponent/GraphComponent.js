import React, { Component } from 'react';
import './GraphComponent.css';
import * as d3 from 'd3';
import ReactDOM from 'react-dom';

import {
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Drawer,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import ViewListIcon from '@material-ui/icons/ViewList';
import EditIcon from '@material-ui/icons/Edit';
import { CompactPicker } from 'react-color';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import * as jc from 'json-cycle';
import NodeDetailComponent from '../NodeDetailComponent/NodeDetailComponent';
import SVGLink from '../SVGLink/SVGLink';
import SVGNode from '../SVGNode/SVGNode';
import api from '../../services/api';

const arrowProperties = {
  width: 6,
  length: 9,
};

const nodeInitRadius = 55;
const nodeRadius = 4;

class GraphComponent extends Component {
  static positionInit(x, y, i, n) {
    const newX = nodeInitRadius * Math.cos((2 * Math.PI * i - Math.PI / 6) / n) + x;
    const newY = nodeInitRadius * Math.sin((2 * Math.PI * i - Math.PI / 6) / n) + y;
    return { x: newX, y: newY };
  }

  constructor(props) {
    super(props);

    this.state = {
      detail: false,
      nodes: [],
      links: [],
      graphObjects: {},
      edgeTypes: [],
      simulation: d3.forceSimulation(),
      svg: undefined,
      selectedChildren: [],
      selectedParents: [],
      selectedAliases: [],
      graphOptions: {
        width: 0,
        height: 0,
        selectedColor: '#D33115',
        aliasesColor: '#FB9E00',
        parentsColor: '#AEA1FF',
        childrenColor: '#73D8FF',
        defaultColor: '#1F265B',
        linkStrength: 1 / 30,
        chargeStrength: 100,
        collisionRadius: 4,
        autoCollisionRadius: false,
      },
      colorKey: 'selectedColor',
      expandable: {},
    };

    this.drawGraph = this.drawGraph.bind(this);
    this.initSimulation = this.initSimulation.bind(this);
    this.getNeighbors = this.getNeighbors.bind(this);
    this.updateColors = this.updateColors.bind(this);
    this.handleColorPick = this.handleColorPick.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleGraphOptionsChange = this.handleGraphOptionsChange.bind(this);
    this.handleDrawerClose = this.handleDrawerClose.bind(this);
    this.handleDrawerOpen = this.handleDrawerOpen.bind(this);
  }

  async componentDidMount() {
    const {
      selectedId,
      search,
      displayed,
      data,
      handleNodeAdd,
    } = this.props;

    this.handleResize();

    this.setState({ edgeTypes: await api.getEdgeTypes() });

    const { neighbors } = queryString.parse(search);

    let validDisplayed = displayed;
    if (!validDisplayed || validDisplayed.length === 0) {
      validDisplayed = [selectedId];
    }

    validDisplayed.forEach((key) => {
      const { nodes, graphObjects } = this.state;
      if (!graphObjects[key]) {
        nodes.push({ data: data[key] });
        graphObjects[key] = data[key];
      }
      handleNodeAdd(data[key]);
      this.setState(
        {
          ...this.processData(
            data[key],
            { x: 0, y: 0 },
            Math.floor(neighbors / 2) + 1,
          ),
        },
      );
    });
    this.drawGraph();
    this.updateColors(validDisplayed[0]);
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    const { svg, simulation } = this.state;
    // remove all event listeners
    svg.call(d3.zoom().on('zoom', null));
    simulation.on('tick', null);
    window.removeEventListener('resize', this.handleResize);
  }

  getNeighbors(node) {
    const {
      expandable,
    } = this.state;
    const { handleNodeAdd } = this.props;

    const depth = 3;
    const url = `/diseases/${node.data['@rid'].slice(1)}?neighbors=${depth}`;
    if (expandable[node.data['@rid']]) {
      api.get(url).then((response) => {
        const cycled = jc.retrocycle(response.result);
        this.setState({
          ...this.processData(
            cycled,
            { x: node.x, y: node.y },
            Math.floor(depth / 2) + 1,
          ),
        });
        handleNodeAdd(cycled);
        this.drawGraph();
        this.updateColors(node.data['@rid']);
      });
    } else {
      handleNodeAdd(node.data);
    }

    delete expandable[node.data['@rid']];
    this.setState({ expandable });
  }

  // TODO: fix bug where expandable flag isnt cleared unless node is clicked
  processData(node, position, depth) {
    const {
      edgeTypes,
      expandable,
      nodes,
      links,
      graphObjects,
    } = this.state;

    const expandedEdgeTypes = edgeTypes.reduce((r, e) => {
      r.push(`in_${e.name}`);
      r.push(`out_${e.name}`);
      return r;
    }, []);

    expandedEdgeTypes.forEach((edgeType) => {
      if (node[edgeType]) {
        const n = node[edgeType].length;
        let j = 0;

        node[edgeType].forEach((edge) => {
          const edgeRid = edge['@rid'] || edge;

          if (!graphObjects[edgeRid]) {
            if (
              edge['@rid']
              && edge.in['@rid']
              && edge.out['@rid']
              && depth > 0
            ) {
              const link = {
                source: edge.out['@rid'],
                target: edge.in['@rid'],
                type: edgeType
                  .split('_')[1]
                  .split('Of')[0]
                  .toLowerCase(),
                '@rid': edge['@rid'],
              };
              links.push(link);
              graphObjects[link['@rid']] = link;

              if (!graphObjects[edge.out['@rid']]) {
                const positionInit = GraphComponent.positionInit(
                  position.x,
                  position.y,
                  j += 1,
                  n,
                );
                const newNode = {
                  data: edge.out,
                  x: positionInit.x,
                  y: positionInit.y,
                };
                nodes.push(newNode);
                graphObjects[newNode.data['@rid']] = newNode;

                const d = this.processData(
                  edge.out,
                  positionInit,
                  depth - 1,
                );
                this.setState({ nodes: d.nodes, links: d.links, graphObjects: d.graphObjects });
              }
              if (!graphObjects[edge.in['@rid']]) {
                const positionInit = GraphComponent.positionInit(
                  position.x,
                  position.y,
                  j += 1,
                  n,
                );
                const newNode = {
                  data: edge.in,
                  x: positionInit.x,
                  y: positionInit.y,
                };

                nodes.push(newNode);
                graphObjects[newNode.data['@rid']] = newNode;
                const d = this.processData(
                  newNode.data,
                  positionInit,
                  graphObjects,
                  depth - 1,
                );
                this.setState({ nodes: d.nodes, links: d.links, graphObjects: d.graphObjects });
              }
            } else {
              expandable[node['@rid']] = true;
            }
          }
        });
      }
    });

    this.setState({ expandable });

    return { nodes, links, graphObjects };
  }

  handleResize() {
    let w;
    let h;
    const n = ReactDOM.findDOMNode(this.refs['wrapper']);
    if (n) {
      w = n.clientWidth;
      h = n.clientHeight;
      const { graphOptions } = this.state;
      graphOptions.width = w;
      graphOptions.height = h;
      this.setState({ graphOptions }, this.initSimulation);
    }
  }

  handleCheckbox() {
    const { graphOptions } = this.state;
    graphOptions.autoCollisionRadius = !graphOptions.autoCollisionRadius;
  }



  initSimulation() {
    const { simulation, graphOptions } = this.state;

    simulation
      .force('link', d3.forceLink().id(d => d.data['@rid']))
      .force(
        'collide',
        d3.forceCollide((d) => {
          if (graphOptions.autoCollisionRadius) {
            if (!d.data.name || d.data.name.length === 0) return 4;
            return d.data.name.length * 2.8;
          }
          return graphOptions.collisionRadius;
        }),
    ) // Can change these to make nodes more readable
      .force(
        'charge',
        d3.forceManyBody().strength(-graphOptions.chargeStrength),
    )
      .force(
        'center',
        d3.forceCenter(
          graphOptions.width / 2,
          graphOptions.height / 2,
        ),
    );

    const container = d3.select(ReactDOM.findDOMNode(this.refs.zoom));

    const svg = d3.select(ReactDOM.findDOMNode(this.refs.graph));
    svg
      .attr('width', graphOptions.width)
      .attr('height', graphOptions.height)
      .call(d3.zoom()
        .scaleExtent([0.5, 10]) // TODO: add to toolbar?
        .on('zoom', () => {
          const { transform } = d3.event;
          container.attr(
            'transform',
            `translate(${transform.x},${transform.y})scale(${transform.k})`,
          );
        }));
    this.setState({ simulation, svg });
  }

  drawGraph() {
    const {
      nodes,
      links,
      simulation,
      graphOptions,
    } = this.state;

    simulation.nodes(nodes);

    simulation.force(
      'links',
      d3
        .forceLink(links)
        .strength(graphOptions.linkStrength)
        .id(d => d.data['@rid']),
    );

    const ticked = () => {
      this.setState({
        links,
        nodes,
      });
    };

    simulation.on('tick', ticked);
    simulation.restart();
    this.setState({ simulation });
  }


  updateColors(rid) {
    const { links } = this.state;
    const selectedAliases = [];
    const selectedChildren = [];
    const selectedParents = [];

    links.forEach((link) => {
      const targetRid = link.target.data
        ? link.target.data['@rid']
        : link.target;
      const sourceRid = link.source.data
        ? link.source.data['@rid']
        : link.source;

      if (targetRid === rid) {
        if (link.type === 'alias') {
          selectedAliases.push(sourceRid);
        } else {
          selectedChildren.push(sourceRid);
        }
      }
      if (sourceRid === rid) {
        if (link.type === 'alias') {
          selectedAliases.push(targetRid);
        } else {
          selectedParents.push(targetRid);
        }
      }
    });
    this.setState({
      expandId: rid,
      selectedAliases,
      selectedChildren,
      selectedParents,
    });
  }

  handleClick(e, node) {
    const { handleClick } = this.props;
    const { expandId } = this.state;

    handleClick(node.data['@rid']);
    if (node.data['@rid'] === expandId) {
      e.stopPropagation();
      this.getNeighbors(node);
    } else {
      this.updateColors(node.data['@rid']);
    }
  }

  handleColorPick(color) {
    const { graphOptions, colorKey } = this.state;
    graphOptions[colorKey] = color.hex;
    this.setState({ graphOptions });
  }

  handleColorKeyChange(key) {
    this.setState({ colorKey: key });
  }

  handleGraphOptionsChange(e) {
    const { graphOptions } = this.state;
    graphOptions[e.target.name] = e.target.value;
    this.setState({ graphOptions }, () => {
      this.initSimulation();
      this.drawGraph();
    });
  }

  handleDrawerClose() {
    this.setState({ detail: false });
  }

  handleDrawerOpen() {
    this.setState({ detail: true });
  }

  render() {
    const {
      nodes,
      links,
      detail,
      expandId,
      expandable,
      graphOptions,
      simulation,
      selectedChildren,
      selectedParents,
      selectedAliases,
      colorKey,
      displayed,
    } = this.state;

    const { data, search } = this.props;
    const detailDrawer = (
      <Drawer
        variant="persistent"
        anchor="right"
        open={detail}
        classes={{
          paper: 'drawer-box-graph',
        }}
        onClose={this.handleDrawerClose}
        SlideProps={{ unmountOnExit: true }}
      >
        <div className="graph-close-drawer-btn">
          <IconButton onClick={this.handleDrawerClose}>
            <CloseIcon color="error" />
          </IconButton>
        </div>
        <NodeDetailComponent node={data[expandId]} />
      </Drawer>
    );

    const linksDisplay = links.map(link => <SVGLink key={link['@rid']} link={link} />);

    const nodesDisplay = nodes.map((node) => {
      const color = () => {
        if (expandId === node.data['@rid']) {
          return graphOptions.selectedColor;
        }
        if (selectedChildren.includes(node.data['@rid'])) {
          return graphOptions.childrenColor;
        }
        if (selectedParents.includes(node.data['@rid'])) {
          return graphOptions.parentsColor;
        }
        if (selectedAliases.includes(node.data['@rid'])) {
          return graphOptions.aliasesColor;
        }
        return graphOptions.defaultColor;
      }

      const isExpandable = expandable[node.data['@rid']];
      return (
        <SVGNode
          key={`node${node.data['@rid']}`}
          node={node}
          simulation={simulation}
          color={color()}
          r={nodeRadius}
          handleClick={e => this.handleClick(e, node)}
          expandable={isExpandable}
        />
      );
    });

    const selected = key => key === colorKey;
    const arrowSize = {
      d: `M0,0,L0,${arrowProperties.width} L ${arrowProperties.length}, ${arrowProperties.width / 2}`,
      refX: nodeRadius + arrowProperties.length + 1,
      refY: arrowProperties.width / 2,
    };

    return (
      <div className="graph-wrapper">
        {detailDrawer}
        <div className="toolbar">
          <Link
            style={{ margin: '4px 12px' }}
            to={{
              pathname: '/data/table',
              search,
              state: displayed
            }}
          >
            <IconButton
              color="secondary"
              style={{
                backgroundColor: 'rgba(0, 137, 123, 0.1)'
              }}
            >
              <ViewListIcon />
            </IconButton>
          </Link>
          <div className="compact-picker">
            <CompactPicker
              color={graphOptions[colorKey]}
              onChangeComplete={this.handleColorPick}
            />
          </div>
          <div className="grid-wrapper">
            <div className="button-grid">
              <Button
                style={{ color: graphOptions.selectedColor }}
                onClick={() => this.handleColorKeyChange('selectedColor')}
                variant={selected('selectedColor') ? 'outlined' : 'flat'}
              >
                Selected
              </Button>
              <Button
                style={{ color: graphOptions.parentsColor }}
                onClick={() => this.handleColorKeyChange('parentsColor')}
                variant={selected('parentsColor') ? 'outlined' : 'flat'}
              >
                SubClass Of
              </Button>
              <Button
                style={{ color: graphOptions.childrenColor }}
                onClick={() => this.handleColorKeyChange('childrenColor')}
                variant={selected('childrenColor') ? 'outlined' : 'flat'}
              >
                has SubClass
              </Button>
              <Button
                style={{ color: graphOptions.aliasesColor }}
                onClick={() => this.handleColorKeyChange('aliasesColor')}
                variant={selected('aliasesColor') ? 'outlined' : 'flat'}
              >
                Aliases
              </Button>
            </div>
          </div>
          <div className="graph-options-wrapper">
            <div className="graph-options-grid">
              <div className="graph-input-wrapper">
                <span>
                  Link Strength
                </span>
                <div className="graph-input">
                  <input
                    label="Link Strength"
                    name="linkStrength"
                    type="number"
                    value={graphOptions.linkStrength}
                    onChange={this.handleGraphOptionsChange}
                  />
                </div>
              </div>
              <div className="graph-input-wrapper">
                <span>
                  Charge Strength
                </span>
                <div className="graph-input">
                  <input
                    label="Charge Strength"
                    name="chargeStrength"
                    type="number"
                    value={graphOptions.chargeStrength}
                    onChange={this.handleGraphOptionsChange}
                  />
                </div>
              </div>
              <div className="graph-input-wrapper">
                <span>
                  Collision Radius
                </span>
                <div className="graph-input">
                  <input
                    label="Collision Radius"
                    name="collisionRadius"
                    type="number"
                    value={graphOptions.collisionRadius}
                    onChange={this.handleGraphOptionsChange}
                  />
                </div>
              </div>
              <div className="graph-input-wrapper">
                <FormControlLabel
                  classes={{
                    root: 'checkbox-wrapper',
                    label: 'checkbox-label',
                  }}
                  control={(
                    <Checkbox
                      onChange={e => this.handleGraphOptionsChange({
                        target: {
                          value: e.target.checked,
                          name: e.target.name,
                        },
                      })
                      }
                      name="autoCollisionRadius"
                      checked={graphOptions.autoCollisionRadius}
                    />
                  )}
                  label="Auto Collision Radius"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="svg-wrapper" ref="wrapper">
          <div className="node-options">
            <IconButton onClick={this.handleDrawerOpen}>
              <EditIcon />
            </IconButton>
          </div>
          <svg ref="graph">
            <defs>
              <marker
                id="arrow"
                markerWidth={arrowProperties.length}
                markerHeight={arrowProperties.width}
                refX={arrowSize.refX}
                refY={arrowSize.refY}
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d={arrowSize.d} fill="#555" />
              </marker>

              <marker
                id="darrow"
                markerWidth="25"
                markerHeight="10"
                refX="-5"
                refY="2"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,2 L6,4 L 6,0 z" fill="#555" />
              </marker>
            </defs>
            <g ref="zoom">
              {linksDisplay}
              {nodesDisplay}
            </g>
          </svg>
        </div>
      </div>
    );
  }
}
export default GraphComponent;
