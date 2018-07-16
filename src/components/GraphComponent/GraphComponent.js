import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './GraphComponent.css';
import * as d3 from 'd3';

import {
  Checkbox,
  FormControlLabel,
  IconButton,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  Typography,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import ViewListIcon from '@material-ui/icons/ViewList';
import EditIcon from '@material-ui/icons/Edit';
import BuildIcon from '@material-ui/icons/Build';
import RefreshIcon from '@material-ui/icons/Refresh';
import { withStyles } from '@material-ui/core/styles';
import { CompactPicker } from 'react-color';
import { Link } from 'react-router-dom';
import * as jc from 'json-cycle';
import NodeDetailComponent from '../NodeDetailComponent/NodeDetailComponent';
import SVGLink from '../SVGLink/SVGLink';
import SVGNode from '../SVGNode/SVGNode';
import api from '../../services/api';
import util from '../../services/util';

// SVG arrow dimensions.
const arrowProperties = {
  width: 6,
  length: 9,
};
// Node position radius initializer.
const nodeInitRadius = 55;
// SVG node radius.
const nodeRadius = 4;

const styles = {
  paper: {
    width: 'calc(100vw - 1px)',
  },
  root: {
    margin: '3px 0 0 -15px',
  },
  label: {
    'margin-left': '- 8px',
    'font-size': '0.9em',
  },
};

/**
 * Component for displaying query results in force directed graph form.
 */
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
      graphOptionsPanel: false,
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
    this.handleOptionsPanelOpen = this.handleOptionsPanelOpen.bind(this);
    this.handleOptionsPanelClose = this.handleOptionsPanelClose.bind(this);
  }

  /**
   * Loads edge types, initializes graph and populates it with specified input nodes.
   * Initializes event listener for window resize.
   */
  async componentDidMount() {
    const {
      selectedId,
      search,
      displayed,
      data,
      handleNodeAdd,
    } = this.props;

    this.handleResize();

    this.setState({ edgeTypes: await api.getOntologyEdges() });

    const { neighbors } = queryString.parse(search);

    let validDisplayed = displayed;
    if (!validDisplayed || validDisplayed.length === 0) {
      validDisplayed = [selectedId];
    }

    validDisplayed.forEach((key) => {
      this.setState(
        {
          ...this.processData(
            data[key],
            { x: 0, y: 0 },
            0,
          ),
        },
      );
    });

    this.drawGraph();
    this.updateColors(validDisplayed[0]);
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Removes all event listeners.
   */
  componentWillUnmount() {
    const { svg, simulation } = this.state;
    // remove all event listeners
    svg.call(d3.zoom().on('zoom', null));
    simulation.on('tick', null);
    window.removeEventListener('resize', this.handleResize);
  }

  /**
   * Calls the api and renders neighbor nodes of the input node onto the graph.
   * @param {Object} node - d3 simulation node whose neighbors were requestsed.
   */
  getNeighbors(node) {
    const {
      expandable,
    } = this.state;
    const { handleNodeAdd } = this.props;

    const endpoint = util.pluralize(node.data['@class']);

    const url = `/${endpoint}/${node.data['@rid'].slice(1)}?neighbors=3`;
    if (expandable[node.data['@rid']]) {
      api.get(url).then((response) => {
        const cycled = jc.retrocycle(response.result);
        this.setState({
          ...this.processData(
            cycled,
            { x: node.x, y: node.y },
            1,
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

  /**
   * Processes node data and updates state with new nodes and links.
   * Returns updated nodes, links, and graphObjects.
  * @param {Object} node - Node object as returned by the api.
  * @param {Object} position - Object containing x and y position of input node.
  * @param {number} depth - Recursion base case flag.
        */
  processData(node, position, depth) {
    const {
      edgeTypes,
      expandable,
      nodes,
      links,
      graphObjects,
    } = this.state;

    if (!graphObjects[node['@rid']]) {
      nodes.push({ data: node });
      graphObjects[node['@rid']] = node;
    }

    expandedEdgeTypes.forEach((edgeType) => {
      if (node[edgeType] && node[edgeType].length !== 0) {
        // stores total number of edges and initializes count for position calculating.
        const n = node[edgeType].length;
        let j = 0;

        node[edgeType].forEach((edge) => {
          const edgeRid = edge['@rid'] || edge;

          // Checks if edge is already rendered in the graph
          if (!graphObjects[edgeRid]) {
            if (
              edge['@rid']
              && edge.in['@rid']
              && edge.out['@rid']
              && depth > 0
            ) {
              // Initialize new link object and pushes to links list.
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

              // Checks if node is already rendered
              if (!graphObjects[edge.out['@rid']]) {
                // Initializes position of new child
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
              // If there are unrendered edges, set expandable flag.
              expandable[node['@rid']] = true;
            }
          }
        });
      }
    });

    this.setState({ expandable });

    return { nodes, links, graphObjects };
  }

  /**
   * Resizes svg window and reinitializes the simulation.
   */
  handleResize() {
    let w;
    let h;
    const n = this.wrapper;

    if (n) {
      w = n.clientWidth;
      h = n.clientHeight;
      const { graphOptions } = this.state;
      graphOptions.width = w;
      graphOptions.height = h;
      this.setState({ graphOptions }, this.initSimulation);
    }
  }

  /**
   * Toggles Auto Collision Radius feature.
   */
  handleCheckbox() {
    const { graphOptions } = this.state;
    graphOptions.autoCollisionRadius = !graphOptions.autoCollisionRadius;
  }

  /**
   * Opens graph options dialog.
   */
  handleOptionsPanelOpen() {
    this.setState({ graphOptionsPanel: true });
  }

  /**
   * Closes graph options dialog.
   */
  handleOptionsPanelClose() {
    this.setState({ graphOptionsPanel: false });
  }

  /**
   * Initializes simulation rules and properties. Updates simulation component state.
   */
  initSimulation() {
    const { simulation, graphOptions } = this.state;

    simulation.force(
      'link',
      d3.forceLink().id(d => d.data['@rid']),
    ).force(
      'collide',
      d3.forceCollide((d) => {
        if (graphOptions.autoCollisionRadius) {
          if (!d.data.name || d.data.name.length === 0) return 4;
          return d.data.name.length * 2.8;
        }
        return graphOptions.collisionRadius;
      }),
    ).force(
      'charge',
      d3.forceManyBody().strength(-graphOptions.chargeStrength),
    ).force(
      'center',
      d3.forceCenter(
        graphOptions.width / 2,
        graphOptions.height / 2,
      ),
    );

    const container = d3.select(this.zoom);

    const svg = d3.select(this.graph);
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

  /**
   * Renders nodes and links to the graph.
   */
  drawGraph(reset) {
    const {
      nodes,
      links,
      simulation,
      graphOptions,
    } = this.state;

    if (reset) {
      simulation.nodes(nodes.map((node) => {
        const n = node;
        delete n.x;
        delete n.y;
        delete n.fx;
        delete n.fy;
        delete n.vx;
        delete n.vy;
        return n;
      }));
    } else {
      simulation.nodes(nodes);
    }


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

  /**
   * Updates selected node's and its neighbors' colors.
   * @param {string} rid - selected node identifier.
   */
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

  /**
   * Updates node colors or retrieves node neighbors.
   * @param {Event} e - User click event.
   * @param {Object} node - Clicked simulation node.
   */
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

  /**
   * Updates color indicators for related/selected nodes
   * @param {Object} color - color object as returned by the colorpicker.
   */
  handleColorPick(color) {
    const { graphOptions, colorKey } = this.state;
    graphOptions[colorKey] = color.hex;
    this.setState({ graphOptions });
  }

  /**
   * Changes the property bound to the colorpicker.
   * @param {string} key - object key for target property.
   */
  handleColorKeyChange(key) {
    this.setState({ colorKey: key });
  }

  /**
   * Updates graph options, re-initializes simulation, and re-renders objects.
   * @param {Event} e - User input event.
   */
  handleGraphOptionsChange(e) {
    const { graphOptions } = this.state;
    graphOptions[e.target.name] = e.target.value;
    this.setState({ graphOptions }, () => {
      this.initSimulation();
      this.drawGraph();
    });
  }

  /**
   * Closes detail drawer.
   */
  handleDrawerClose() {
    this.setState({ detail: false });
  }

  /**
   * Updates data and opens detail drawer.
   */
  async handleDrawerOpen() {
    const { expandId } = this.state;
    const { data } = this.props;

    if (!data[expandId]) {
      // Change this to general ontology endpoint.
      const response = await api.get(`/diseases/${expandId.slice(1)}?neighbors=3`);
      data[expandId] = jc.retrocycle(response.result);
    }

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
      graphOptionsPanel,
    } = this.state;

    const {
      data,
      search,
      handleNodeEditStart,
      classes,
    } = this.props;


    const selected = key => key === colorKey;

    const arrowSize = {
      d: `M0,0,L0,${arrowProperties.width} L ${arrowProperties.length}, ${arrowProperties.width / 2}`,
      refX: nodeRadius + arrowProperties.length + 1,
      refY: arrowProperties.width / 2,
    };

    const optionsPanel = (
      <Dialog
        open={graphOptionsPanel}
        onClose={this.handleOptionsPanelClose}
      >
        <DialogTitle>
          Graph Options
        </DialogTitle>
        <DialogContent className="options-grid">
          <div>
            <div className="compact-picker">
              <CompactPicker
                color={graphOptions[colorKey]}
                onChangeComplete={this.handleColorPick}
              />
            </div>
            <List dense>
              <ListItem>
                <Typography
                  style={
                    {
                      color: graphOptions.selectedColor,
                      border: selected('selectedColor')
                        ? `solid 1px ${graphOptions.selectedColor}`
                        : 'none',
                      padding: selected('selectedColor')
                        ? '8px'
                        : '9px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }
                  }
                  onClick={() => this.handleColorKeyChange('selectedColor')}
                >
                  selected
                </Typography>
              </ListItem>
              <ListItem>
                <Typography
                  style={
                    {
                      color: graphOptions.parentsColor,
                      border: selected('parentsColor')
                        ? `solid 1px ${graphOptions.parentsColor}`
                        : 'none',
                      padding: selected('parentsColor')
                        ? '8px'
                        : '9px',
                      borderRadius: '4px',
                    }
                  }
                  onClick={() => this.handleColorKeyChange('parentsColor')}
                >
                  subclass of
                </Typography>
              </ListItem>
              <ListItem>
                <Typography
                  style={
                    {
                      color: graphOptions.childrenColor,
                      border: selected('childrenColor')
                        ? `solid 1px ${graphOptions.childrenColor}`
                        : 'none',
                      padding: selected('childrenColor')
                        ? '8px'
                        : '9px',
                      borderRadius: '4px',
                    }
                  }
                  onClick={() => this.handleColorKeyChange('childrenColor')}
                >
                  has subclass
                </Typography>
              </ListItem>
              <ListItem>
                <Typography
                  style={
                    {
                      color: graphOptions.aliasesColor,
                      border: selected('aliasesColor')
                        ? `solid 1px ${graphOptions.aliasesColor}`
                        : 'none',
                      padding: selected('aliasesColor')
                        ? '8px'
                        : '9px',
                      borderRadius: '4px',
                    }
                  }
                  onClick={() => this.handleColorKeyChange('aliasesColor')}
                >
                  aliases
                </Typography>
              </ListItem>
            </List>
          </div>

          <div className="graph-options-wrapper">
            <div className="graph-input-wrapper">
              <span className="label">
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
              <span className="label">
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
              <span className="label">
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
            <div>
              <FormControlLabel
                classes={{
                  root: classes.root,
                  label: classes.label,
                }}
                control={(
                  <Checkbox
                    color="secondary"
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
        </DialogContent>
      </Dialog>
    );

    const detailDrawer = (
      <Drawer
        variant="persistent"
        anchor="right"
        open={detail}
        classes={{
          paper: classes.paper,
        }}
        onClose={this.handleDrawerClose}
        SlideProps={{ unmountOnExit: true }}
      >
        <div className="graph-close-drawer-btn">
          <IconButton onClick={this.handleDrawerClose}>
            <CloseIcon color="action" />
          </IconButton>
        </div>
        <NodeDetailComponent
          node={data[expandId]}
          handleNodeEditStart={handleNodeEditStart}
        />
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
      };

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

    return (
      <div className="graph-wrapper">
        {detailDrawer}
        {optionsPanel}
        <div className="toolbar">
          <Link
            to={{
              pathname: '/data/table',
              search,
              state: displayed,
            }}
            style={{
              margin: 'auto 24px auto 8px',
            }}
          >
            <IconButton
              color="secondary"
              style={{
                backgroundColor: 'rgba(0, 137, 123, 0.1)',
              }}
              onClick={this.handleOptionsPanelOpen}
            >
              <ViewListIcon />
            </IconButton>
          </Link>

          <IconButton
            color="primary"
            onClick={this.handleOptionsPanelOpen}
            style={{
              margin: 'auto 8px',
            }}
          >
            <BuildIcon />
          </IconButton>

          <IconButton
            color="primary"
            onClick={() => { this.initSimulation(); this.drawGraph(true); }}
            style={{
              margin: 'auto 8px',
            }}
          >
            <RefreshIcon />
          </IconButton>
        </div>

        <div className="svg-wrapper" ref={(node) => { this.wrapper = node; }}>
          <div className="node-options">
            <IconButton onClick={this.handleDrawerOpen}>
              <EditIcon />
            </IconButton>
          </div>
          <svg ref={(node) => { this.graph = node; }}>
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
            <g ref={(node) => { this.zoom = node; }}>
              {linksDisplay}
              {nodesDisplay}
            </g>
          </svg>
        </div>
      </div>
    );
  }
}

GraphComponent.defaultProps = {
  handleNodeAdd: null,
  handleClick: null,
  classes: null,
};

/**
* @param {function} handleNodeAdd - Parent component method triggered when a node
  * is added to the graph.
* @param {function} handleClick - Parent component method triggered when a graph object is clicked.
* @param {function} handleNodeEditStart - Method triggered when node edit start is requested.
* @param {Object} data - Parent state data.
* @param {string} search - url search string.
  */
GraphComponent.propTypes = {
  handleNodeAdd: PropTypes.func,
  handleClick: PropTypes.func,
  handleNodeEditStart: PropTypes.func.isRequired,
  data: PropTypes.object.isRequired,
  search: PropTypes.string.isRequired,
  classes: PropTypes.object,
};


export default withStyles(styles)(GraphComponent);
