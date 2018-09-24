/**
 * @module /components/GraphComponent
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './GraphComponent.css';
import * as d3 from 'd3';
import qs from 'qs';
import {
  IconButton,
  List,
  ListItem,
  Typography,
  Paper,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Snackbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Checkbox,
  DialogActions,
  Divider,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import ViewListIcon from '@material-ui/icons/ViewList';
import BuildIcon from '@material-ui/icons/Build';
import RefreshIcon from '@material-ui/icons/Refresh';
import GraphLinkDisplay from '../GraphLinkDisplay/GraphLinkDisplay';
import GraphNodeDisplay from '../GraphNodeDisplay/GraphNodeDisplay';
import util from '../../services/util';
import {
  PropsMap,
  GraphOptions,
  GraphNode,
  GraphLink,
} from './kbgraph';
import config from '../../config.json';
import GraphActionsNode from './GraphActionsNode';
import GraphOptionsPanel from './GraphOptionsPanel';

const {
  ARROW_WIDTH,
  ARROW_LENGTH,
  NODE_INIT_RADIUS,
  ZOOM_BOUNDS,
} = config.GRAPH_PROPERTIES;
const { PALLETE_SIZE } = config.GRAPH_DEFAULTS;
const { GRAPH_UNIQUE_LIMIT } = config.NOTIFICATIONS;


// Component specific constants.
const AUTO_SPACE_COEFFICIENT = 2.8;
const SNACKBAR_AUTOHIDE_DURATION = 6000;
const MARKER_ID = 'endArrow';
const DIALOG_FADEOUT_TIME = 150;

/**
 * Component for displaying query results in force directed graph form.
 * Implements a d3 force-directed graph: https://github.com/d3/d3-force.
 */
class GraphComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nodes: [],
      links: [],
      graphObjects: {},
      expandable: {},
      expandedEdgeTypes: [],
      actionsNode: null,
      simulation: d3.forceSimulation(),
      svg: undefined,
      width: 0,
      height: 0,
      graphOptions: new GraphOptions(),
      graphOptionsOpen: false,
      refreshable: false,
      initState: null,
      actionsNodeIsEdge: false,
      expansionDialogOpen: false,
      expandNode: null,
      expandExclusions: [],
    };

    this.propsMap = new PropsMap();

    this.applyDrag = this.applyDrag.bind(this);
    this.drawGraph = this.drawGraph.bind(this);
    this.initSimulation = this.initSimulation.bind(this);
    this.loadNeighbors = this.loadNeighbors.bind(this);
    this.handleExpandRequest = this.handleExpandRequest.bind(this);
    this.refresh = this.refresh.bind(this);
    this.updateColors = this.updateColors.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleGraphOptionsChange = this.handleGraphOptionsChange.bind(this);
    this.withClose = this.withClose.bind(this);
    this.handleNodeHide = this.handleNodeHide.bind(this);
    this.handleLinkHide = this.handleLinkHide.bind(this);
    this.handleDialogOpen = this.handleDialogOpen.bind(this);
    this.handleDialogClose = this.handleDialogClose.bind(this);
    this.handleLinkClick = this.handleLinkClick.bind(this);
    this.handleExpandExclusion = this.handleExpandExclusion.bind(this);
    this.handleExpandByClass = this.handleExpandByClass.bind(this);
    this.handleExpandCheckAll = this.handleExpandCheckAll.bind(this);
  }

  /**
   * Loads edge types, initializes graph and populates it with specified input nodes.
   * Initializes event listener for window resize.
   */
  async componentDidMount() {
    const {
      displayed,
      data,
      schema,
      allProps,
      filteredSearch,
      edges,
    } = this.props;
    const {
      expandable,
      graphOptions,
      initState,
    } = this.state;
    this.propsMap = new PropsMap();

    // Defines what edge keys to look for.
    const expandedEdgeTypes = util.expandEdges(edges);
    let validDisplayed = displayed;
    if (!displayed || displayed.length === 0) {
      validDisplayed = [Object.keys(data)[0]];
    }

    const stringifiedSearch = qs.stringify(filteredSearch);

    this.setState({
      expandedEdgeTypes,
      schema,
      allProps,
      filteredSearch: stringifiedSearch,
    }, () => {
      this.handleResize();
      window.addEventListener('resize', this.handleResize);

      const storedData = util.getGraphData(stringifiedSearch);
      const storedOptions = GraphOptions.retrieve();

      /**
       * Initialization priority:
       *
       * 1. Checked rows from tableview always override stored state.
       * 2. Initial state is checked. This will never be chosen on the
       *    component's first load.
       * 3. Stored state will be loaded if the query parameters match those of
       *    the last stored state.
       */
      if ((displayed && displayed.length !== 0) || (!initState && !storedData)) {
        validDisplayed.forEach((key, i) => {
          this.processData(
            data[key],
            util.positionInit(0, 0, i, validDisplayed.length),
            0,
          );
        });

        const { nodes, links, graphObjects } = this.state;
        util.loadGraphData(stringifiedSearch, { nodes, links, graphObjects });
      } else if (initState) {
        const {
          graphObjects,
          nodes,
          links,
        } = initState;
        nodes.forEach((node) => {
          this.propsMap.loadNode(node.data, allProps);
          util.expanded(expandedEdgeTypes, graphObjects, node.getId(), expandable);
        });

        links.forEach(link => this.propsMap.loadLink(link.data));

        this.setState({
          graphObjects: Object.assign({}, graphObjects),
          nodes: nodes.slice(),
          links: links.slice(),
        });
      } else if (storedData && storedData.filteredSearch === stringifiedSearch) {
        const {
          graphObjects,
        } = storedData;
        let { nodes, links } = storedData;
        delete storedData.filteredSearch;
        nodes = nodes.map((n) => {
          this.propsMap.loadNode(n.data, allProps);
          util.expanded(expandedEdgeTypes, graphObjects, n.data['@rid'], expandable);
          return new GraphNode(n.data, n.x, n.y);
        });

        links = links.map((l) => {
          this.propsMap.loadLink(l.data);
          let source;
          let target;
          if (typeof l.source === 'object') {
            source = l.source.data['@rid'];
          } else {
            source = l.source;
          }
          if (typeof l.target === 'object') {
            target = l.target.data['@rid'];
          } else {
            target = l.target;
          }
          return new GraphLink(l.data, source, target);
        });
        this.setState({
          graphObjects,
          nodes,
          links,
          initState: {
            graphObjects: Object.assign({}, graphObjects),
            nodes: nodes.slice(),
            links: links.slice(),
          },
        });
      }

      if (storedOptions) {
        this.setState({ graphOptions: storedOptions }, () => {
          this.drawGraph();
          this.updateColors();
        });
      } else {
        if (this.propsMap.nodeProps.length !== 0) {
          graphOptions.nodesLegend = true;
        }
        this.setState({ graphOptions }, () => {
          this.drawGraph();
          this.updateColors();
        });
      }
    });
  }

  /**
   * Removes all event listeners.
   */
  componentWillUnmount() {
    const {
      svg,
      simulation,
      graphObjects,
      nodes,
      links,
      filteredSearch,
    } = this.state;
    // remove all event listeners
    svg.call(d3.zoom()
      .on('zoom', null))
      .on('dblclick.zoom', null);
    simulation.on('tick', null);
    window.removeEventListener('resize', this.handleResize);
    util.loadGraphData(filteredSearch, { nodes, links, graphObjects });
  }

  /**
   * Applies drag behavior to node.
   * @param {Object} node - node to be dragged.
   */
  applyDrag(node) {
    const { simulation } = this.state;
    d3.event.sourceEvent.stopPropagation();

    if (!d3.event.active) simulation.alphaTarget(0.3).restart();

    function dragged() {
      node.fx = d3.event.x;
      node.fy = d3.event.y;
    }

    function ended() {
      if (!d3.event.active) simulation.alphaTarget(0);
      node.fx = null;
      node.fy = null;
    }

    d3.event
      .on('drag', dragged)
      .on('end', ended);
  }

  /**
   * Renders nodes and links to the graph.
   */
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
        .id(d => d.getId()),
    );

    const ticked = () => {
      this.setState({
        links,
        nodes,
      });
    };

    simulation.on('tick', ticked);
    simulation.restart();
    this.setState({ simulation, actionsNode: null });
  }

  /**
   * Initializes simulation rules and properties. Updates simulation component state.
   */
  initSimulation() {
    const {
      simulation,
      graphOptions,
      width,
      height,
    } = this.state;

    simulation.force(
      'link',
      d3.forceLink().id(d => d.getId()),
    ).force(
      'collide',
      d3.forceCollide((d) => {
        if (graphOptions.autoCollisionRadius) {
          let obj = d.data;
          let key = graphOptions.nodeLabelProp;
          if (key.includes('.')) {
            [, key] = key.split('.');
            obj = graphOptions.nodeLabelProp.split('.')[0] || {};
          }
          if (!obj[key] || obj[key].length === 0) return graphOptions.collisionRadius;
          return Math.max(obj[key].length * AUTO_SPACE_COEFFICIENT, NODE_INIT_RADIUS);
        }
        return graphOptions.collisionRadius;
      }),
    ).force(
      'charge',
      d3.forceManyBody().strength(-graphOptions.chargeStrength),
    ).force(
      'center',
      d3.forceCenter(
        width / 2,
        height / 2,
      ),
    );

    const container = d3.select(this.zoom);
    const svg = d3.select(this.graph);

    svg
      .attr('width', width)
      .attr('height', height)
      .call(d3.zoom()
        .scaleExtent(ZOOM_BOUNDS)
        .on('zoom', () => {
          const { transform } = d3.event;
          container.attr(
            'transform',
            `translate(${transform.x},${transform.y})scale(${transform.k})`,
          );
        }))
      .on('dblclick.zoom', null);

    this.setState({ simulation, svg });
  }

  /**
   * Calls the api and renders neighbor nodes of the input node onto the graph.
   * @param {Object} node - d3 simulation node whose neighbors were requestsed.
   */
  loadNeighbors(node) {
    const {
      expandable,
      filteredSearch,
      nodes,
      links,
      graphObjects,
      expandExclusions,
    } = this.state;
    const { data } = this.props;
    if (expandable[node.getId()] && data[node.getId()]) {
      this.processData(
        data[node.getId()],
        { x: node.x, y: node.y },
        1,
        expandExclusions,
      );
      this.drawGraph();
      this.updateColors();
    }
    if (!data[node.getId()].getEdges().some(edge => !links.find(l => l.getId() === edge['@rid']))) {
      delete expandable[node.getId()];
    }
    util.loadGraphData(filteredSearch, { nodes, links, graphObjects });
    this.setState({
      expandable,
      actionsNode: null,
      refreshable: true,
      expandExclusions: [],
    });
  }

  handleExpandRequest(node) {
    const {
      expandable,
      links,
    } = this.state;
    const { data } = this.props;
    if (expandable[node.getId()] && data[node.getId()]) {
      if (data[node.getId()]
        .getEdges()
        .filter(edge => !(links.find(l => l.getId() === edge['@rid']))).length > 10
      ) {
        this.setState({ expansionDialogOpen: true, expandNode: data[node.getId()] });
      } else {
        this.loadNeighbors(node);
      }
    }
  }

  /**
   * Processes node data and updates state with new nodes and links. Also
   * updates expandable flags.
   * @param {Object} node - Node object as returned by the api.
   * @param {Object} position - Object containing x and y position of input node.
   * @param {number} depth - Recursion base case flag.
   */
  processData(node, position, depth, exclusions = []) {
    const {
      expandedEdgeTypes,
      expandable,
      nodes,
      links,
      graphObjects,
    } = this.state;
    // From DataView.js
    const { data, handleNewColumns } = this.props;

    if (data[node['@rid'] || data[node.getId()]]) {
      node = data[node['@rid'] || data[node.getId()]];
    } else {
      // Node properties haven't been processed.
      handleNewColumns(node);
    }
    const { allProps } = this.props;

    if (!graphObjects[node['@rid']]) {
      nodes.push(new GraphNode(node, position.x, position.y));
      graphObjects[node['@rid']] = node;
      this.propsMap.loadNode(node, allProps);
    }

    /**
     * Cycles through all potential edges as defined by the schema, and expands
     * those edges if present on the node.
     */
    expandedEdgeTypes.forEach((edgeType) => {
      if (node[edgeType] && node[edgeType].length !== 0) {
        // stores total number of edges and initializes count for position calculating.
        const n = node[edgeType].length;
        let i = 0;

        // Looks through each edge of certain type.
        node[edgeType].forEach((edge) => {
          const edgeRid = edge['@rid'] || edge;

          // Checks if edge is already rendered in the graph
          if (!graphObjects[edgeRid] && !exclusions.includes(edgeRid)) {
            const inRid = (edge.in || {})['@rid'] || edge.in;
            const outRid = (edge.out || {})['@rid'] || edge.out;
            const targetRid = inRid === node['@rid'] ? outRid : inRid;
            // TODO: Remove once statements are stable.
            if (edge.out['@class'] === 'Statement' || edge.in['@class'] === 'Statement') {
              return;
            }
            if (
              edgeRid
              && inRid
              && outRid
              && (depth > 0 || graphObjects[targetRid])
            ) {
              // Initialize new link object and pushes to links list.
              const link = new GraphLink(edge, outRid, inRid);
              links.push(link);
              graphObjects[link.getId()] = link;
              this.propsMap.loadLink(link.data);
              // Checks if node is already rendered
              if (outRid && !graphObjects[outRid]) {
                // Initializes position of new child
                const positionInit = util.positionInit(
                  position.x,
                  position.y,
                  i += 1,
                  n,
                );
                this.processData(
                  edge.out,
                  positionInit,
                  depth - 1,
                  exclusions,
                );
              }
              if (inRid && !graphObjects[inRid]) {
                const positionInit = util.positionInit(
                  position.x,
                  position.y,
                  i += 1,
                  n,
                );
                this.processData(
                  edge.in,
                  positionInit,
                  depth - 1,
                  exclusions,
                );
              }

              // Updates expanded on target node.
              if (expandable[targetRid]) {
                util.expanded(expandedEdgeTypes, graphObjects, targetRid, expandable);
              }
            } else {
              // If there are unrendered edges, set expandable flag.
              expandable[node['@rid']] = true;
            }
          }
        });
      }
    });

    this.setState({
      expandable,
      nodes,
      links,
      graphObjects,
    });
  }

  /**
   * Restarts simulation with initial nodes and links present. These are determined by the
   * first state rendered when the component mounts.
   */
  refresh() {
    const { handleDetailDrawerClose } = this.props;
    this.setState({
      nodes: [],
      links: [],
      graphObjects: {},
      refreshable: false,
    }, this.componentDidMount);
    handleDetailDrawerClose();
  }

  /**
   * Updates color scheme for the graph, for nodes or links.
   */
  updateColors() {
    ['node', 'link'].forEach((type) => {
      const objs = this.state[`${type}s`];
      const { graphOptions } = this.state;
      const key = graphOptions[`${type}sColor`];
      const colors = {};

      objs.forEach((obj) => {
        if (key.includes('.')) {
          const [prop, nestedProp] = key.split('.');
          if (
            obj.data[prop]
            && obj.data[prop][nestedProp]
            && !colors[obj.data[prop][nestedProp]]
          ) {
            colors[obj.data[prop][nestedProp]] = '';
          }
        }
        if (obj.data[key] && !colors[obj.data[key]]) {
          colors[obj.data[key]] = '';
        }
      });
      const props = this.propsMap[`${type}Props`];
      const tooManyUniques = (Object.keys(colors).length > PALLETE_SIZE
        && Object.keys(props).length !== 1);
      const noUniques = props[key]
        && (props[key].length === 0
          || (props[key].length === 1 && props[key].includes('null')));
      const notDefined = key && !props[key];

      if (tooManyUniques || noUniques || notDefined) {
        let snackbarMessage = '';
        if (tooManyUniques) {
          snackbarMessage = `${GRAPH_UNIQUE_LIMIT} (${graphOptions[`${type}sColor`]})`;
        }

        graphOptions[`${type}sColor`] = '';
        this.setState({ graphOptions, snackbarMessage }, () => this.updateColors());
      } else {
        const pallette = util.getPallette(Object.keys(colors).length, `${type}s`);
        Object.keys(colors).forEach((color, i) => { colors[color] = pallette[i]; });

        graphOptions[`${type}sColors`] = colors;
        graphOptions[`${type}sPallette`] = pallette;
        this.setState({ graphOptions });
      }
    });
  }

  /**
   * Handles user selections within the actions ring.
   */
  withClose(action) {
    return () => {
      action();
      this.setState({ actionsNode: null });
    };
  }

  /**
   * Handles node clicks from user.
   * @param {Event} e - User click event.
   * @param {Object} node - Clicked simulation node.
   */
  async handleClick(e, node) {
    const { handleClick, handleDetailDrawerOpen } = this.props;

    // Prematurely loads neighbor data.
    await handleClick(node.getId());

    // Update contents of detail drawer if open.
    handleDetailDrawerOpen(node);
    // Sets clicked object as actions node.
    this.setState({ actionsNode: node, actionsNodeIsEdge: false });
  }

  /**
   * Updates graph options, re-initializes simulation, and re-renders objects.
   * @param {Event} e - User input event.
   * @param {boolean} adv - Advanced option flag.
   */
  handleGraphOptionsChange(e, adv) {
    const { graphOptions, refreshable } = this.state;
    graphOptions[e.target.name] = e.target.value;
    graphOptions.load();
    this.setState({ graphOptions, refreshable: adv || refreshable }, () => {
      this.initSimulation();
      this.drawGraph();
      this.updateColors();
    });
  }

  /**
   * Closes additional help dialog.
   */
  handleDialogClose(key) {
    return () => this.setState({ [key]: false },
      () => setTimeout(() => this.setState({ expandExclusions: [] }), DIALOG_FADEOUT_TIME));
  }

  /**
   * Opens additional help dialog.
   * @param {string} key - ['main', 'advanced'].
   */
  handleDialogOpen(key) {
    return () => this.setState({ [key]: true });
  }

  /**
   * Handles link clicks from user.
   * @param {Event} e - User click event.
   * @param {Object} link - Clicked simulation link.
   */
  handleLinkClick(e, link) {
    const { handleDetailDrawerOpen } = this.props;

    // Update contents of detail drawer if open.
    handleDetailDrawerOpen(link, false, true);

    // Sets clicked object as actions node.
    this.setState({ actionsNode: link, actionsNodeIsEdge: true });
  }

  /**
   * Hides link from the graph view.
   */
  handleLinkHide() {
    const {
      actionsNode,
      links,
      graphObjects,
      expandable,
    } = this.state;
    const { handleDetailDrawerClose } = this.props;

    const i = links.indexOf(actionsNode);
    links.splice(i, 1);
    delete graphObjects[actionsNode.data['@rid']];

    expandable[actionsNode.source.data['@rid']] = true;
    expandable[actionsNode.target.data['@rid']] = true;

    this.setState({
      actionsNode: null,
      graphObjects,
      links,
      expandable,
      refreshable: true,
    }, () => {
      this.updateColors();
      handleDetailDrawerClose();
    });
  }

  /**
   * Removes node and all corresponding links from the graph.
   */
  handleNodeHide() {
    const {
      actionsNode,
      graphObjects,
      nodes,
      links,
      expandedEdgeTypes,
      expandable,
      allProps,
      filteredSearch,
    } = this.state;

    const { handleDetailDrawerClose } = this.props;
    if (nodes.length === 1) return;
    const i = nodes.indexOf(actionsNode);

    nodes.splice(i, 1);
    delete graphObjects[actionsNode.data['@rid']];

    expandedEdgeTypes.forEach((edgeType) => {
      if (actionsNode.data[edgeType] && actionsNode.data[edgeType].length !== 0) {
        actionsNode.data[edgeType].forEach((edge) => {
          const edgeRid = edge['@rid'] || edge;
          const j = links.findIndex(l => l.data['@rid'] === edgeRid);
          if (j !== -1) {
            const link = links[j];
            const targetRid = link.source.data['@rid'] === actionsNode.data['@rid']
              ? link.target.data['@rid'] : link.source.data['@rid'];
            links.splice(j, 1);
            this.propsMap.removeLink(link.data, links);
            delete graphObjects[edgeRid];
            expandable[targetRid] = true;
          }
        });
      }
    });

    this.propsMap.removeNode(actionsNode.data, nodes, allProps);

    this.setState({
      expandable,
      nodes,
      links,
      graphObjects,
      actionsNode: null,
      refreshable: true,
    }, () => {
      this.updateColors();
      handleDetailDrawerClose();
      util.loadGraphData(filteredSearch, { nodes, links, graphObjects });
    });
  }

  /**
   * Resizes svg window and reinitializes the simulation.
   */
  handleResize() {
    if (this.wrapper) {
      this.setState(
        {
          width: this.wrapper.clientWidth,
          height: this.wrapper.clientHeight,
        }, this.initSimulation,
      );
    }
  }

  /**
   * Toggles a specified edge ID from the exclusions list.
   * @param {string} rid - edge ID to be pushed/popped from the expand
   * exclusions list.
   */
  handleExpandExclusion(rid) {
    const { expandExclusions } = this.state;
    const i = expandExclusions.indexOf(rid);
    if (i === -1) {
      expandExclusions.push(rid);
    } else {
      expandExclusions.splice(i, 1);
    }
    this.setState({ expandExclusions });
  }

  /**
   * Selects/Deselects all options in the expand node dialog.
   */
  handleExpandCheckAll() {
    const { expandExclusions, expandNode } = this.state;
    const allEdges = expandNode.getEdges().map(e => e['@rid']);
    let newExpandExclusions = [];
    if (expandExclusions.length !== allEdges.length) {
      newExpandExclusions = allEdges;
    }
    this.setState({ expandExclusions: newExpandExclusions });
  }

  /**
   * Expands all links of specified class on the expand node.
   * @param {string} cls - KB edge class name to be expanded.
   */
  handleExpandByClass(cls) {
    return () => {
      const { expandNode, actionsNode } = this.state;
      const expandExclusions = [];
      expandNode.getEdges().forEach((edge) => {
        if (edge['@class'] !== cls) {
          expandExclusions.push(edge['@rid']);
        }
      });
      this.setState({
        expandExclusions,
        expansionDialogOpen: false,
      }, () => this.loadNeighbors(actionsNode));
    };
  }

  render() {
    const {
      nodes,
      links,
      actionsNode,
      expandable,
      graphOptions,
      simulation,
      snackbarMessage,
      refreshable,
      actionsNodeIsEdge,
      graphOptionsOpen,
      expansionDialogOpen,
      expandNode,
      expandExclusions,
    } = this.state;

    const { propsMap } = this;

    const {
      handleTableRedirect,
      detail,
      handleDetailDrawerOpen,
    } = this.props;

    if (!simulation) return null;

    const linkLegendDisabled = (
      links.length === 0
      || links.filter((l) => {
        let source;
        let target;
        if (typeof l.source === 'object') {
          source = l.source.data['@rid'];
        } else {
          source = l.source;
        }
        if (typeof l.target === 'object') {
          target = l.target.data['@rid'];
        } else {
          target = l.target;
        }
        return source !== target;
      }).length === 0
    );

    const legend = (
      !!(graphOptions.nodesLegend && graphOptions.nodesColor)
      || !!(graphOptions.linksLegend && graphOptions.linksColor)
    )
      && (
        <div className="legend-wrapper">
          {graphOptions.nodesLegend && graphOptions.nodesColor && (
            <Paper>
              <div className="close-btn">
                <IconButton
                  name="nodesLegend"
                  onClick={() => this.handleGraphOptionsChange({
                    target: {
                      value: false,
                      name: 'nodesLegend',
                    },
                  })}
                >
                  <CloseIcon />
                </IconButton>
              </div>
              <div className="legend-content">
                <Typography variant="subheading">Nodes</Typography>
                <Typography variant="caption">
                  {graphOptions.nodesColor ? `(${util.antiCamelCase(graphOptions.nodesColor)})` : ''}
                </Typography>
                <List className="node-colors" dense>
                  {Object.keys(graphOptions.nodesColors).map(key => (
                    <ListItem key={key}>
                      <ListItemIcon>
                        <div
                          style={{ backgroundColor: graphOptions.nodesColors[key] }}
                          className="color-chip"
                        />
                      </ListItemIcon>
                      <ListItemText primary={util.antiCamelCase(key)} />
                    </ListItem>
                  ))}
                  {(propsMap.nodeProps[graphOptions.nodesColor] || []).includes('null') && (
                    <ListItem key="null">
                      <ListItemIcon>
                        <div
                          style={{ backgroundColor: graphOptions.defaultColor }}
                          className="color-chip"
                        />
                      </ListItemIcon>
                      <ListItemText primary="Null" />
                    </ListItem>
                  )}
                </List>
              </div>
            </Paper>)}
          {!linkLegendDisabled
            && graphOptions.linksLegend
            && graphOptions.linksColor
            && (
              <Paper>
                <div className="close-btn">
                  <IconButton
                    name="linksLegend"
                    onClick={() => this.handleGraphOptionsChange({
                      target: {
                        value: false,
                        name: 'linksLegend',
                      },
                    })}
                  >
                    <CloseIcon />
                  </IconButton>
                </div>
                <div className="legend-content">
                  <Typography variant="subheading">Edges</Typography>
                  <Typography variant="caption">
                    {graphOptions.linksColor && `(${util.antiCamelCase(graphOptions.linksColor)})`}
                  </Typography>
                  <List className="node-colors" dense>
                    {Object.keys(graphOptions.linksColors).map(key => (
                      <ListItem key={key}>
                        <ListItemIcon>
                          <div
                            style={{ backgroundColor: graphOptions.linksColors[key] }}
                            className="color-chip"
                          />
                        </ListItemIcon>
                        <ListItemText primary={util.antiCamelCase(key)} />
                      </ListItem>
                    ))}
                    {(propsMap.linkProps[graphOptions.linksColor] || []).includes('null') && (
                      <ListItem key="null">
                        <ListItemIcon>
                          <div
                            style={{ backgroundColor: graphOptions.defaultColor }}
                            className="color-chip"
                          />
                        </ListItemIcon>
                        <ListItemText primary="Null" />
                      </ListItem>
                    )}
                  </List>
                </div>
              </Paper>
            )}
        </div>
      );
    const expansionDialog = expandNode && (
      <Dialog
        open={expansionDialogOpen}
        onClose={this.handleDialogClose('expansionDialogOpen')}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Select Edges to Expand</DialogTitle>
        <DialogContent>
          <Typography variant="subheading">
            Expand by Edge Types:
          </Typography>
          <List dense className="expand-links-types">
            {expandNode.getEdges().reduce((array, edge) => {
              if (!array.includes(edge['@class']) && !links.find(l => l.getId() === edge['@rid'])) {
                array.push(edge['@class']);
              }
              return array;
            }, []).map(edge => (
              <ListItem
                key={edge}
                className="expand-links-type"
              >
                <Button variant="contained" color="primary" onClick={this.handleExpandByClass(edge)}>
                  {util.getEdgeLabel(edge)}
                </Button>
              </ListItem>
            ))}
          </List>
          <Typography variant="subheading">
            Select Individual Links:
          </Typography>
          <ListItem
            button
            onClick={this.handleExpandCheckAll}
            className="expand-links-link"
          >
            <Checkbox checked={!(expandExclusions.length === expandNode.getEdges().length)} />
            <ListItemText>
              <Typography variant="subheading">
                {expandExclusions.length === expandNode.getEdges().length
                  ? 'Select All' : 'Deselect All'}
              </Typography>
            </ListItemText>
          </ListItem>
          <Divider />
          <List dense className="expand-links-list">
            {expandNode.getEdges().map((edge) => {
              const inRid = edge.in['@rid'];
              const target = inRid === expandNode.getId() ? edge.out : edge.in;
              if (target['@rid'] === expandNode.getId()
                || links.find(l => l.getId() === edge['@rid'])) {
                return null;
              }
              return (
                <ListItem
                  key={edge['@rid']}
                  button
                  onClick={() => this.handleExpandExclusion(edge['@rid'])}
                  className="expand-links-link"
                >
                  <Checkbox checked={!expandExclusions.includes(edge['@rid'])} />
                  <ListItemText>
                    <Typography variant="body2">{target.name}</Typography>
                    <Typography variant="body1">{target.sourceId}</Typography>
                    <Typography variant="caption">{target.source.name || expandNode.source.name}</Typography>
                  </ListItemText>
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleDialogClose('expansionDialogOpen')}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              this.setState({ expansionDialogOpen: false });
              setTimeout(() => this.loadNeighbors(actionsNode), DIALOG_FADEOUT_TIME);
            }}
            id="expand-dialog-submit"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    );

    const snackbar = (
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={!!snackbarMessage}
        onClose={() => this.setState({ snackbarMessage: null })}
        autoHideDuration={SNACKBAR_AUTOHIDE_DURATION}
        message={(
          <span>
            {snackbarMessage}
          </span>
        )}
        action={(
          <Button color="secondary" onClick={() => this.setState({ snackbarMessage: null })}>
            Ok
          </Button>
        )}
      />
    );

    const actionsRingOptions = actionsNodeIsEdge
      ? [
        {
          name: 'Details',
          icon: <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />,
          action: this.withClose(() => handleDetailDrawerOpen(actionsNode, true, true)),
          disabled: link => link.getId() === (detail || {})['@rid'],
        },
        {
          name: 'Hide',
          icon: <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />,
          action: () => this.withClose(this.handleLinkHide),
          disabled: false,
        }] : [
        {
          name: 'Details',
          icon: <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />,
          action: this.withClose(() => handleDetailDrawerOpen(actionsNode, true)),
          disabled: node => node.getId() === (detail || {})['@rid'],
        },
        {
          name: 'Close',
          icon: <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />,
          action: this.withClose(() => { }),
        },
        {
          name: 'Expand',
          icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />,
          action: () => this.handleExpandRequest(actionsNode),
          disabled: node => !expandable[node.getId()],
        },
        {
          name: 'Hide',
          icon: <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />,
          action: this.withClose(this.handleNodeHide),
          disabled: () => nodes.length === 1,
        },
      ];

    const actionsRing = (
      <GraphActionsNode
        actionsNode={actionsNode}
        options={actionsRingOptions}
        withClose={this.withClose}
        edge={actionsNodeIsEdge}
      />
    );

    const linksDisplay = links.map(link => (
      <GraphLinkDisplay
        key={link.getId()}
        link={link}
        detail={detail}
        labelKey={graphOptions.linkLabelProp}
        color={util.getColor(link, graphOptions.linksColor, graphOptions.linksColors)}
        handleClick={e => this.handleLinkClick(e, link)}
        actionsNode={actionsNode}
        marker={`url(#${MARKER_ID})`}
      />));

    const nodesDisplay = nodes.map(node => (
      <GraphNodeDisplay
        key={node.getId()}
        node={node}
        labelKey={graphOptions.nodeLabelProp}
        color={util.getColor(node, graphOptions.nodesColor, graphOptions.nodesColors)}
        handleClick={e => this.handleClick(e, node)}
        expandable={expandable[node.getId()]}
        applyDrag={this.applyDrag}
      />
    ));

    return (
      <div className="graph-wrapper">
        {snackbar}
        {expansionDialog}
        <GraphOptionsPanel
          linkLegendDisabled={linkLegendDisabled}
          graphOptionsOpen={graphOptionsOpen}
          graphOptions={graphOptions}
          propsMap={propsMap}
          handleDialogClose={this.handleDialogClose}
          handleGraphOptionsChange={this.handleGraphOptionsChange}
        />

        <div className={`toolbar ${detail ? 'transition-left' : ''}`}>
          <Tooltip placement="top" title="Return to table view">
            <IconButton
              color="secondary"
              className="table-btn"
              onClick={handleTableRedirect}
            >
              <ViewListIcon />
            </IconButton>
          </Tooltip>

          <Tooltip placement="top" title="Graph options">
            <IconButton
              id="graph-options-btn"
              color="primary"
              onClick={this.handleDialogOpen('graphOptionsOpen')}
            >
              <BuildIcon />
            </IconButton>
          </Tooltip>

          <Tooltip placement="top" title="Restart simulation with initial nodes">
            <div>
              <IconButton
                color="primary"
                onClick={this.refresh}
                disabled={!refreshable}
              >
                <RefreshIcon />
              </IconButton>
            </div>
          </Tooltip>
        </div>

        <div className="svg-wrapper" ref={(node) => { this.wrapper = node; }}>
          <svg
            ref={(node) => { this.graph = node; }}
            onClick={(e) => {
              if (e.target === this.graph) {
                this.setState({ actionsNode: null });
              }
            }}
          >
            <defs>
              <marker
                id={MARKER_ID}
                markerWidth={ARROW_LENGTH}
                markerHeight={ARROW_WIDTH}
                refY={ARROW_WIDTH / 2}
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path
                  d={`M0,0,L0,${ARROW_WIDTH} L ${ARROW_LENGTH}, ${ARROW_WIDTH / 2} z`}
                  fill="#555"
                />
              </marker>
            </defs>
            <g ref={(node) => { this.zoom = node; }}>
              {linksDisplay}
              {nodesDisplay}
              {actionsRing}
            </g>
          </svg>
        </div>
        {legend}
      </div>
    );
  }
}

GraphComponent.propTypes = {
  /**
   * @param {function} handleClick - Parent component method triggered when a
   * graph object is clicked.
   */
  handleClick: PropTypes.func,
  /**
   * @param {Object} data - Parent state data.
   */
  data: PropTypes.object.isRequired,
  /**
   * @param {function} handleDetailDrawerOpen - Method to handle opening of detail drawer.
   */
  handleDetailDrawerOpen: PropTypes.func.isRequired,
  /**
   * @param {function} handleDetailDrawerClose - Method to handle closing of detail drawer.
   */
  handleDetailDrawerClose: PropTypes.func.isRequired,
  /**
   * @param {function} handleTableRedirect - Method to handle a redirect to the table view.
   */
  handleTableRedirect: PropTypes.func.isRequired,
  /**
   * @param {function} handleNewColumns - Updates valid properties in parent state.
   */
  handleNewColumns: PropTypes.func.isRequired,
  /**
   * @param {Object} schema - Database schema.
   */
  schema: PropTypes.object.isRequired,
  /**
   * @param {Object} detail - record ID of node currently selected for detail viewing.
   */
  detail: PropTypes.object,
  /**
   * @param {Array} allProps - list of all unique properties on all nodes returned in
   * initial query.
   */
  allProps: PropTypes.array,
};

GraphComponent.defaultProps = {
  handleClick: null,
  detail: null,
  allProps: [],
};

export default GraphComponent;
