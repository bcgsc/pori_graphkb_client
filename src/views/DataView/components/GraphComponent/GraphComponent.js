/**
 * @module /components/GraphComponent
 */
import './GraphComponent.scss';

import { SnackbarContext } from '@bcgsc/react-snackbar-provider';
import {
  IconButton,
  Tooltip,
} from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';
import SettingsIcon from '@material-ui/icons/Settings';
import SaveStateIcon from '@material-ui/icons/SettingsRemote';
import { boundMethod } from 'autobind-decorator';
import * as d3Force from 'd3-force';
import * as d3Select from 'd3-selection';
import * as d3Zoom from 'd3-zoom';
import isObject from 'lodash.isobject';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import schema from '@/services/schema';
import util from '@/services/util';
import config from '@/static/config';

import GraphActionsNode from './GraphActionsNode';
import GraphArrowMarker from './GraphArrowMarker';
import GraphExpansionDialog from './GraphExpansionDialog/GraphExpansionDialog';
import GraphLegend from './GraphLegend/GraphLegend';
import GraphLinkDisplay from './GraphLinkDisplay/GraphLinkDisplay';
import GraphNodeDisplay from './GraphNodeDisplay/GraphNodeDisplay';
import GraphOptionsPanel from './GraphOptionsPanel/GraphOptionsPanel';
import {
  GraphLink,
  GraphNode,
  GraphOptions,
  PropsMap,
} from './kbgraph';
import {
  computeNodeLevels,
  copyURLToClipBoard,
  getId,
  TREE_LINK,
} from './util';

const {
  GRAPH_PROPERTIES: {
    ZOOM_BOUNDS,
    MARKER_ID,
    DIALOG_FADEOUT_TIME,
    HEAVILY_CONNECTED,
  },
  GRAPH_DEFAULTS: {
    PALLETE_SIZE,
  },
  NOTIFICATIONS: {
    GRAPH_UNIQUE_LIMIT,
  },
} = config;

/**
 * Component for displaying query results in force directed graph form.
 * Implements a d3 force-directed graph: https://github.com/d3/d3-force.
 *
 * @property {object} props
 * graph object is clicked.
 * @property {function} props.handleDetailDrawerOpen - Method to handle opening of detail drawer.
 * @property {function} props.handleDetailDrawerClose - Method to handle closing of detail drawer.
 * @property {Object} props.detail - record ID of node currently selected for detail viewing.
 * in the initial query.
 * @property {Object} props.data - graph data in the format of { '@rid': {data}, ... }
 * @property {Array.<string>} props.nodesRIDs - an array of node RIDs to fetch ex. ['#25:0', '#56:9']
 * @property {Array.<string>} props.edgeTypes - list of valid edge classes.
 * @property {Array.<string>} props.displayed - list of initial record ID's to be displayed in
 * graph.
 * @property {function} props.handleGraphStateSave - parent handler to save state in URL
 */
class GraphComponent extends Component {
  // App snackbar context value.
  static contextType = SnackbarContext;

  static propTypes = {
    handleDetailDrawerOpen: PropTypes.func.isRequired,
    handleDetailDrawerClose: PropTypes.func.isRequired,
    detail: PropTypes.object,
    data: PropTypes.object.isRequired,
    cache: PropTypes.object.isRequired,
    edgeTypes: PropTypes.arrayOf(PropTypes.string),
    handleError: PropTypes.func.isRequired,
    handleGraphStateSave: PropTypes.func,
  };

  static defaultProps = {
    detail: null,
    edgeTypes: [],
    handleGraphStateSave: () => {},
  };

  constructor(props) {
    super(props);
    const { data: initialGraphData } = props;
    this.state = {
      nodes: [],
      links: [],
      data: initialGraphData,
      graphObjects: {},
      expandable: {},
      actionsNode: null,
      simulation: d3Force.forceSimulation(),
      svg: undefined,
      graphOptions: new GraphOptions(),
      graphOptionsOpen: false,
      expansionDialogOpen: false,
      expandNode: null,
      expandExclusions: [],
      allProps: ['@rid', '@class', 'name'],
    };

    this.propsMap = new PropsMap();
  }

  @boundMethod
  getGraphOptions() {
    const graphOptions = new GraphOptions();
    const storedOptions = GraphOptions.retrieve();
    let initialGraphOptions;

    if (storedOptions) {
      initialGraphOptions = storedOptions;
    } else {
      const nodePropVal = Object.values(this.propsMap.nodeProps);
      const nodeHasDefaultProps = nodePropVal.length !== 0;

      if (nodeHasDefaultProps) {
        graphOptions.nodesLegend = true;
      }
      initialGraphOptions = graphOptions;
    }

    return initialGraphOptions;
  }

  /**
   * Loads edge types, initializes graph and populates it with specified input nodes.
   * Initializes event listener for window resize.
   */

  componentDidMount() {
    const {
      data,
      simulation,
    } = this.state;
    let {
      expandable, nodes, links, graphObjects,
    } = this.state;
    this.propsMap = new PropsMap();

    this.handleResize();
    window.addEventListener('resize', this.handleResize);

    const nodeRIDs = Object.keys(data);
    nodeRIDs.forEach((rid, index) => {
      ({
        nodes,
        links,
        graphObjects,
        expandable,
      } = this.processData(
        data[rid],
        util.positionInit(this.wrapper.clientWidth / 2, this.wrapper.clientHeight / 2, index, nodeRIDs.length),
        false,
        {
          nodes,
          links,
          graphObjects,
          expandable,
        },
      ));
    });

    const graphOptions = this.getGraphOptions(this.propsMap);
    this.initSimulation(simulation, graphOptions);

    const initialSeed = {
      simulation, graphOptions, nodes, links,
    };
    this.refresh(initialSeed);

    this.setState({
      nodes,
      links,
      graphObjects,
      expandable,
    });
  }

  /**
   * Removes all event listeners.
   */
  componentWillUnmount() {
    const {
      svg,
      simulation,
      graphOptions,
    } = this.state;

    // remove all event listeners
    if (svg) {
      svg.call(d3Zoom.zoom()
        .on('zoom', null))
        .on('dblclick.zoom', null);
    }
    simulation.on('tick', null);
    window.removeEventListener('resize', this.handleResize);
    graphOptions.load();
  }


  /**
   * Applies drag behavior to node.
   * @param {GraphNode} node - node to be dragged.
   */
  @boundMethod
  applyDrag(node) {
    const { simulation } = this.state;
    d3Select.event.sourceEvent.stopPropagation();

    if (!d3Select.event.active) simulation.alphaTarget(0.3).restart();

    const dragged = () => {
      // move nodes via fixed position temporary
      node.fx = d3Select.event.x; // eslint-disable-line no-param-reassign
      node.fy = d3Select.event.y; // eslint-disable-line no-param-reassign
      node.x = d3Select.event.x; // eslint-disable-line no-param-reassign
      node.y = d3Select.event.y; // eslint-disable-line no-param-reassign
    };

    const ended = () => {
      if (!d3Select.event.active) {
        simulation.alphaTarget(0);
      }

      // disable fixed position once dragEvent ends
      node.fx = null; // eslint-disable-line no-param-reassign
      node.fy = null; // eslint-disable-line no-param-reassign
    };

    d3Select.event
      .on('drag', dragged)
      .on('end', ended);
  }

  /**
   * Renders nodes and links to the graph.
   */
  @boundMethod
  drawGraph(nodes, links, simulation, graphOptions) {
    // set up the hierarchy
    simulation.nodes(nodes);

    if (graphOptions.isTreeLayout) {
      const ranks = computeNodeLevels(links);
      const partitions = Math.max(...[0, ...Object.values(ranks)]) + 2;
      const partitionSize = this.wrapper.clientHeight / partitions;
      // partial force https://stackoverflow.com/questions/39575319/partial-forces-on-nodes-in-d3-js
      const subclassYForce = d3Force.forceY(node => (partitions - ranks[getId(node)] - 1) * partitionSize);
      const init = subclassYForce.initialize;

      subclassYForce.initialize = (allNodes) => {
        init(allNodes.filter(node => ranks[getId(node)] !== undefined));
      };

      simulation.force('y', subclassYForce);
    }

    simulation.force(
      'links',
      d3Force
        .forceLink(links)
        .strength((link) => {
          if ((link.data['@class'] !== TREE_LINK) && graphOptions.isTreeLayout) {
            return 5 * graphOptions.linkStrength;
          }
          return graphOptions.linkStrength;
        }).id(d => d.getId()),
    );

    const ticked = () => {
      const shiftDistance = 1 * simulation.alpha();
      links.forEach((data) => {
        if (data.data['@class'] === TREE_LINK && graphOptions.isTreeLayout) {
          data.source.y += shiftDistance;
          data.target.y -= shiftDistance;
        }
      });
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
  @boundMethod
  initSimulation(simulation, graphOptions) {
    simulation.force(
      'link',
      d3Force.forceLink().id(d => d.getId()),
    ).force(
      'collide',
      d3Force.forceCollide(graphOptions.collisionRadius),
    ).force(
      'charge',
      d3Force.forceManyBody()
        .strength(-graphOptions.chargeStrength)
        .distanceMax(graphOptions.chargeMax),
    );

    const container = d3Select.select(this.zoom);
    const svg = d3Select.select(this.graph);

    svg
      .attr('width', this.wrapper.clientWidth)
      .attr('height', this.wrapper.clientHeight)
      .call(d3Zoom.zoom()
        .scaleExtent(ZOOM_BOUNDS)
        .on('zoom', () => {
          const { transform } = d3Select.event;
          container.attr(
            'transform',
            `translate(${transform.x},${transform.y})scale(${transform.k})`,
          );
        }))
      .on('dblclick.zoom', null);

    this.setState({ simulation, svg });
    return simulation;
  }

  /**
   * Calls the api and renders neighbor nodes of the input node onto the graph.
   * @param {GraphNode} node - d3 simulation node whose neighbors were requested.
   */
  @boundMethod
  loadNeighbors(node) {
    const {
      expandExclusions, data, simulation, graphOptions,
    } = this.state;
    let {
      nodes,
      links,
      graphObjects,
      expandable,
    } = this.state;

    if (expandable[node.getId()] && data[node.getId()]) {
      ({
        nodes,
        links,
        graphObjects,
        expandable,
      } = this.processData(
        data[node.getId()],
        { x: node.x, y: node.y },
        true,
        {
          nodes,
          links,
          graphObjects,
          expandable,
        },
        expandExclusions,
      ));
    }

    this.refresh({
      simulation, graphOptions, nodes, links,
    });
    this.saveGraphStatetoURL([...nodes]);

    if (!schema.getEdges(data[node.getId()]).some(edge => !links.find(l => l.getId() === edge['@rid']))) {
      delete expandable[node.getId()];
    }

    this.setState({
      expandable,
      actionsNode: null,
      expandExclusions: [],
      nodes,
      links,
      graphObjects,
    });
  }

  /**
   * Determines whether to quickly selected load node neighbors or open the
   * expansion dialog panel.
   * @param {GraphNode} node - d3 simulation node to be expanded.
   */
  @boundMethod
  handleExpandRequest(node) {
    const {
      expandable,
      links,
      data,
    } = this.state;

    const nodeIsHeavilyConnected = (currNode) => {
      const nodeEdges = schema.getEdges(currNode);
      const edgesToBeRendered = nodeEdges.filter(edge => !(links.find(l => l.getId() === edge['@rid'])));
      return (edgesToBeRendered.length > HEAVILY_CONNECTED);
    };

    if (expandable[node.getId()] && data[node.getId()]) {
      if (nodeIsHeavilyConnected(data[node.getId()])
      ) {
        // Opens up expansion confirmation dialog
        this.setState({ expandNode: data[node.getId()], expansionDialogOpen: true });
        this.pauseGraph();
      } else {
        this.loadNeighbors(node);
      }
    }
  }

  @boundMethod
  async handleExpandNode({ data: node }) {
    const { cache, handleError } = this.props;
    const { data } = this.state;

    try {
      const record = await cache.getRecord(node);

      if (data[record['@rid']] === undefined) {
        data[record['@rid']] = record;
        this.setState({ data });
      }
    } catch (err) {
      handleError(err);
    }
  }

  /**
   * Pauses d3 force simulation by making simulation 'tick' event handler a
   * noop.
   */
  @boundMethod
  pauseGraph() {
    const { simulation } = this.state;
    simulation.on('tick', null);
  }

  updateColumnProps(node) {
    const { allProps } = this.state;
    const nodeProps = Object.keys(node);
    nodeProps.forEach((prop) => { allProps.push(prop); });
    const updatedAllProps = [...new Set(allProps)];
    this.setState({ allProps: updatedAllProps });
  }

  /**
   * Adds a graphNode or graphLink to graphObjects.
   * @param {string} type one of ['link', 'node']
   * @param {object} data record information
   * @param {object} prop1 either x position if graphNode or source if graphLink
   * @param {object} prop2 either y position if graphNode or target if graphLink
   * @param {object} graphObjects graphObjects attached to simulation
   * @param {object} propsMap keeps track of node/link properties and associated values
   */
  addGraphObject = (type, data, prop1, prop2, graphObjects, propsMap) => {
    const newGraphObject = type === 'node'
      ? new GraphNode(data, prop1, prop2)
      : new GraphLink(data, prop1, prop2);

    const { [`${type}s`]: objs, allProps } = this.state;
    objs.push(newGraphObject);
    graphObjects[data['@rid']] = data;

    if (type === 'node') {
      propsMap.loadNode(data, allProps);
    } else {
      propsMap.loadLink(data);
    }
  };

  /**
   * Processes node data and updates state with new nodes and links. Also
   * updates expandable object which tracks via RID which nodes can be expanded.
   * @param {Object} node - record object as returned by the api. One of [node, link, edge]
   * @param {Object} pos - Object containing x and y position of node.
   * @param {bool} expansionFlag - Whether or not edges/links of record being processed
   * should also have it's edges/links expanded. If false, only record is processed.
   * @param {Object} prevstate - Object containing nodes, links,
   * graphobjects, and expandable map, from previous state.
   * @param {Array.<string>} [exclusions=[]] - List of edge ID's to be ignored on expansion.
   */
  processData(node, pos, expansionFlag, prevstate, exclusions = []) {
    const { data } = this.state;
    const { edgeTypes } = this.props;
    let {
      nodes,
      links,
      graphObjects,
      expandable,
    } = prevstate;

    if (data[node['@rid']]) {
      node = data[node['@rid']]; // eslint-disable-line no-param-reassign
    } else {
      // Node properties haven't been processed.
      this.updateColumnProps(node);
    }

    if (!graphObjects[node['@rid']]) {
      this.addGraphObject('node', node, pos.x, pos.y, graphObjects, this.propsMap);
    }

    /**
     * Cycles through all potential edges as defined by the schema, and expands
     * those edges if present on the node.
     */
    edgeTypes.forEach((edgeType) => {
      if (node[edgeType] && node[edgeType].length !== 0) {
        // stores total number of edges and initializes count for position calculating.
        const n = node[edgeType].length;

        // Looks through each edge of certain type.
        node[edgeType].forEach((edge, index) => {
          const edgeRid = edge['@rid'] || edge;

          // Checks if edge is already rendered in the graph
          if (!graphObjects[edgeRid] && !exclusions.includes(edgeRid)) {
            const inRid = (edge.in || {})['@rid'] || edge.in;
            const outRid = (edge.out || {})['@rid'] || edge.out;
            const targetRid = inRid === node['@rid'] ? outRid : inRid;

            if (
              edgeRid && inRid && outRid
              && (expansionFlag || graphObjects[targetRid])
            ) {
              this.addGraphObject('link', edge, outRid, inRid, graphObjects, this.propsMap);

              // Checks if node is already rendered
              if (outRid && !graphObjects[outRid]) {
                // Initializes position of new child
                const positionInit = util.positionInit(pos.x, pos.y, index, n);
                ({
                  nodes,
                  links,
                  expandable,
                  graphObjects,
                } = this.processData(
                  edge.out,
                  positionInit,
                  false,
                  {
                    nodes,
                    links,
                    expandable,
                    graphObjects,
                  },
                  exclusions,
                ));
              }
              if (inRid && !graphObjects[inRid]) {
                const positionInit = util.positionInit(pos.x, pos.y, index, n);
                ({
                  nodes,
                  links,
                  expandable,
                  graphObjects,
                } = this.processData(
                  edge.in,
                  positionInit,
                  false,
                  {
                    nodes,
                    links,
                    expandable,
                    graphObjects,
                  },
                  exclusions,
                ));
              }

              // Updates expanded on target node.
              if (expandable[targetRid]) {
                expandable = util.expanded(edgeTypes, graphObjects, targetRid, expandable);
              }
            } else {
              // If there are unrendered edges, set expandable flag.
              expandable[node['@rid']] = true;
            }
          }
        });
      }
    });
    // add a check for link properties here to create links where necessary
    const linkTypes = ['conditions', 'evidence', 'relevance', 'subject'];
    linkTypes.forEach((linkType) => {
      const linkData = Array.isArray(node[linkType]) ? node[linkType] : [node[linkType]];

      if (linkData[0] && linkData.length !== 0) {
        const n = linkData.length;

        linkData.forEach((link, index) => {
          const linkRid = link['@rid'];
          const sourceRid = node['@rid'];
          const targetRid = link['@rid'];
          // unique Rid from source and target nodes. Prevents rendering same link twice
          const linkerRid = `${sourceRid.replace(/:|#/g, '')}:${targetRid.replace(/:|#/g, '')}`;
          // check to see if link is in graph already rendered

          if (!graphObjects[linkerRid] && !exclusions.includes(linkRid)) {
            if (expansionFlag || graphObjects[targetRid]) {
              // create link object and push it to links list
              const graphLinkData = {
                '@rid': linkerRid,
                '@class': linkType,
                in: sourceRid,
                out: targetRid,
                isLinkProp: true,
              };
              this.addGraphObject('link', graphLinkData, sourceRid, targetRid, graphObjects, this.propsMap);

              // check if node is already rendered
              if (targetRid && !graphObjects[targetRid]) {
                // Initializes position of new child
                const positionInit = util.positionInit(pos.x, pos.y, index, n);
                ({
                  nodes,
                  links,
                  expandable,
                  graphObjects,
                } = this.processData(
                  link,
                  positionInit,
                  false,
                  {
                    nodes,
                    links,
                    expandable,
                    graphObjects,
                  },
                  exclusions,
                ));
              }
              // consider link properties only if node is not expandable after edge check
              if (!expandable[targetRid]) {
                expandable = util.expanded(linkTypes, graphObjects, targetRid, expandable);
              }
            } else {
              expandable[node['@rid']] = true;
            }
          }
        });
      }
    });

    return {
      expandable,
      nodes,
      links,
      graphObjects,
    };
  }

  /**
   * Restarts the layout simulation with the current nodes
   *
   * @property {object} seed seed graph Info to refresh view
   * @property {d3} simulation d3 force layout
   * @property {graphOptions} graphOptions graphOptions object
   * @property {Arrayof<GraphObjects>} nodes list of node graphObjects
   * @property {Arrayof<GraphObjects>} links list of link graphObjects
   */
  @boundMethod
  refresh(seed = null) {
    const {
      simulation, graphOptions, nodes, links,
    } = !seed ? this.state : seed;

    const { handleDetailDrawerClose } = this.props;
    this.updateColors(nodes, links, graphOptions); // updates color scheme based on graph objects
    this.drawGraph(nodes, links, simulation, graphOptions); // renders nodes and links to graph
    simulation.alpha(1).restart();
    handleDetailDrawerClose();
  }

  /**
   * updates color mapping based on data properties of graphobject and selected
   * coloring key.
   *
   * @param {object} colorPalette maps properties to colors from palette
   * @param {object} graphObjectData data from graph object
   * @param {string} key selected coloring key ex. 'class', 'rid', 'name'
   */
  updateColorPalette = (colorPalette, graphObjectData, key) => {
    const colorMapping = { ...colorPalette };

    if (key.includes('.')) {
      const [prop, nestedProp] = key.split('.');

      if (
        graphObjectData[prop]
        && graphObjectData[prop][nestedProp]
        && !colorMapping[graphObjectData[prop][nestedProp]]
      ) {
        colorMapping[graphObjectData[prop][nestedProp]] = '';
      }
    }

    if (isObject(graphObjectData[key])) { // value is object
      if (graphObjectData[key].displayName && !colorMapping[graphObjectData[key].displayName]) {
        colorMapping[graphObjectData[key].displayName] = '';
      }
    } else if (graphObjectData[key] && !colorMapping[graphObjectData[key]]) {
      colorMapping[graphObjectData[key]] = '';
    }
    return colorMapping;
  };

  /**
   * Given key and all unique node/link props, checks to see if key selected
   * is a valid or bad choice for node/link coloring. Also returns whether or not
   * there are too many unique colors for given key.
   */
  coloringKeyCheck = (propsMap, colorPalette = {}, key, type) => {
    const props = propsMap[`${type}Props`];
    const tooManyUniques = (Object.keys(colorPalette).length > PALLETE_SIZE
        && Object.keys(props).length !== 1);
    const noUniques = props[key]
        && (props[key].length === 0
          || (props[key].length === 1 && props[key].includes('null')));
    const notDefined = key && !props[key];

    const isColoringKeyBad = (tooManyUniques || noUniques || notDefined);
    return [isColoringKeyBad, tooManyUniques];
  };

  /**
   * Updates color scheme for the graph, for nodes or links via graphOptions.
   */
  @boundMethod
  updateColors(nodes, links, graphOptions) {
    const snackbar = this.context;
    ['node', 'link'].forEach((type) => {
      const objs = type === 'node' ? nodes : links;
      const key = graphOptions[`${type}sColor`];

      let colors = {};
      objs.forEach((obj) => {
        colors = this.updateColorPalette(colors, obj.data, key);
      });
      const [isColoringKeyBad, tooManyUniques] = this.coloringKeyCheck(this.propsMap, colors, key, type);

      if (isColoringKeyBad) {
        if (tooManyUniques) {
          snackbar.add(`${GRAPH_UNIQUE_LIMIT} (${graphOptions[`${type}sColor`]})`);
        }
        graphOptions[`${type}sColor`] = ''; // reset coloring prop chosen
        this.updateColors(nodes, links, graphOptions);
      } else {
        const pallette = util.getPallette(Object.keys(colors).length, `${type}s`);
        Object.keys(colors).forEach((prop, i) => { colors[prop] = pallette[i]; });

        graphOptions[`${type}sColors`] = colors;
        graphOptions[`${type}sPallette`] = pallette;

        this.setState({ graphOptions });
      }
    });
  }

  /**
   * Handles user selections within the actions ring.
   * @param {function} action - callback function to be called before node is
   * deselected.
   */
  @boundMethod
  withClose(action = null) {
    if (action) {
      action();
    }
    this.setState({ actionsNode: null });
  }

  /**
   * Handles node clicks from user.
   * @param {Object} node - Clicked simulation node.
   */
  @boundMethod
  async handleClick(node) {
    const { handleDetailDrawerOpen } = this.props;
    // Prematurely loads neighbor data.
    await this.handleExpandNode(node);

    // Update contents of detail drawer if open.
    handleDetailDrawerOpen(node);
    // Sets clicked object as actions node.
    this.setState({ actionsNode: node });
  }

  /**
   * Updates graph options, re-initializes simulation, and re-renders objects.
   * @param {Event} event - User input event.
   * @param {boolean} isAdvanced - Advanced option flag.
   */
  @boundMethod
  handleGraphOptionsChange(event) {
    const {
      graphOptions, simulation, nodes, links,
    } = this.state;
    graphOptions[event.target.name] = event.target.value;
    graphOptions.load();
    this.refresh({
      simulation, graphOptions, nodes, links,
    });
  }

  /**
   * Closes additional help dialog.
   * @property {string} key is one of ['expansionDialogOpen', 'graphOptionsOpen']
   */
  @boundMethod
  handleDialogClose(key) {
    const {
      nodes, links, simulation, graphOptions,
    } = this.state;

    this.setState({ [key]: false });
    this.drawGraph(nodes, links, simulation, graphOptions);
    setTimeout(() => this.setState({ expandExclusions: [] }), DIALOG_FADEOUT_TIME);
  }

  /**
   * Opens graphOptions help dialog.
   */
  @boundMethod
  openGraphOptions() {
    this.setState({ graphOptionsOpen: true });
    this.pauseGraph();
  }

  /**
   * Expands currently staged nodes. Passed to GraphExpansion Dialog to expand nodes.
   */
  @boundMethod
  handleExpand() {
    const { actionsNode } = this.state;
    this.setState({ expansionDialogOpen: false });
    setTimeout(() => this.loadNeighbors(actionsNode), DIALOG_FADEOUT_TIME);
  }

  /**
   * Handles link clicks from user.
   * @param {Object} link - Clicked simulation link.
   */
  @boundMethod
  handleLinkClick(link) {
    const { handleDetailDrawerOpen } = this.props;

    // Update contents of detail drawer if open.
    handleDetailDrawerOpen(link, false, true);

    // Sets clicked object as actions node.
    this.setState({ actionsNode: link });
  }

  /**
   * Hides link from the graph view.
   */
  @boundMethod
  handleLinkHide() {
    const {
      actionsNode,
      links,
      nodes,
      graphOptions,
      graphObjects,
      expandable,
    } = this.state;
    const { handleDetailDrawerClose } = this.props;

    const i = links.indexOf(actionsNode);
    links.splice(i, 1);
    delete graphObjects[actionsNode.data['@rid']];

    expandable[actionsNode.source.data['@rid']] = true;
    expandable[actionsNode.target.data['@rid']] = true;

    this.updateColors(nodes, links, graphOptions);
    handleDetailDrawerClose();

    this.setState({
      actionsNode: null,
      graphObjects,
      links,
      expandable,
    });
  }

  /**
   * Removes node and all corresponding links from the graph.
   */
  @boundMethod
  handleNodeHide() {
    const {
      actionsNode,
      graphObjects,
      nodes,
      links,
      expandable,
      allProps,
      graphOptions,
    } = this.state;

    const { edgeTypes } = this.props;

    const { handleDetailDrawerClose } = this.props;
    if (nodes.length === 1) return;
    const i = nodes.indexOf(actionsNode);

    nodes.splice(i, 1);
    delete graphObjects[actionsNode.data['@rid']];

    edgeTypes.forEach((edgeType) => {
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
    this.saveGraphStatetoURL(nodes);
    this.updateColors(nodes, links, graphOptions);
    handleDetailDrawerClose();

    this.setState({
      expandable,
      nodes,
      links,
      graphObjects,
      actionsNode: null,
    });
  }

  /**
   * Resizes svg window and reinitializes the simulation.
   */
  @boundMethod
  handleResize() {
    if (this.wrapper) {
      this.refresh();
    }
  }

  /**
   * Toggles a specified edge ID from the exclusions list.
   * @param {string} rid - edge ID to be pushed/popped from the expand
   * exclusions list.
   */
  @boundMethod
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
  @boundMethod
  handleExpandCheckAll() {
    const { expandExclusions, expandNode } = this.state;
    const allEdges = schema.getEdges(expandNode).map(e => e['@rid']);
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
  @boundMethod
  handleExpandByClass(cls) {
    return () => {
      const { expandNode } = this.state;
      const expandExclusions = [];
      schema.getEdges(expandNode).forEach((edge) => {
        if (edge['@class'] !== cls) {
          expandExclusions.push(edge['@rid']);
        }
      });
      this.setState({ expandExclusions });
    };
  }

  /**
   * Saves graph state into URL. Only graph nodes are saved to maximize
   * number of nodes that can be shared. Also reheats simulation and changes
   * node coloring to avoid sending full graph state over limited URL.
   */
  @boundMethod
  saveGraphStatetoURL(nodes) {
    const { handleGraphStateSave, handleError } = this.props;
    const withoutStatementData = [];

    /* Because properties types like linkset are uni-directional, we need to
    have nodes that are connected via a linkset property rendered first.
    For example, if a statement class node has a link property 'conditions' which
    points to node A, node A will not have an equivalent 'implies' property
    to map it back to the statement node */

    nodes.forEach((node) => {
      if (node.data['@class'] !== 'Statement') {
        withoutStatementData.push(node.data['@rid']);
      }
    });

    const nodeRIDs = [...withoutStatementData];
    nodes.forEach((node) => {
      if (node.data['@class'] === 'Statement') {
        nodeRIDs.push(node.data['@rid']);
      }
    });

    try {
      handleGraphStateSave(nodeRIDs);
    } catch (err) {
      handleError(err);
    }
  }

  render() {
    const {
      nodes,
      links,
      actionsNode,
      expandable,
      graphOptions,
      graphOptionsOpen,
      expansionDialogOpen,
      expandNode,
      expandExclusions,
    } = this.state;

    const { propsMap, context: snackbar } = this;

    const {
      detail,
      handleDetailDrawerOpen,
    } = this.props;

    const linkLegendDisabled = (
      links.length === 0
      || !links.some((l) => {
        let source;
        let target;

        if (typeof l.source === 'object') {
          source = l.source.data['@rid'];
        } else {
          ({ source } = l);
        }
        if (typeof l.target === 'object') {
          target = l.target.data['@rid'];
        } else {
          ({ target } = l);
        }
        return source !== target;
      })
    );

    // edges dont have an x or y position
    const actionsNodeIsEdge = actionsNode ? Boolean(!actionsNode.x || !actionsNode.y) : false;
    const actionsRingOptions = actionsNodeIsEdge
      ? [
        {
          name: 'Details',
          action: () => this.withClose(() => handleDetailDrawerOpen(actionsNode, true, true)),
          disabled: link => link.getId() === (detail || {})['@rid'],
        },
        {
          name: 'Hide',
          action: () => this.withClose(this.handleLinkHide),
          disabled: false,
        }] : [
        {
          name: 'Details',
          action: () => this.withClose(() => handleDetailDrawerOpen(actionsNode, true)),
          disabled: node => node.getId() === (detail || {})['@rid'],
        },
        {
          name: 'Close',
          action: () => this.withClose(),
        },
        {
          name: 'Expand',
          action: () => this.handleExpandRequest(actionsNode),
          disabled: node => !expandable[node.getId()],
        },
        {
          name: 'Hide',
          action: () => this.withClose(this.handleNodeHide),
          disabled: () => nodes.length === 1,
        },
      ];

    const actionsRing = (
      <GraphActionsNode
        actionsNode={actionsNode}
        options={actionsRingOptions}
        edge={actionsNodeIsEdge}
      />
    );

    const linksDisplay = links.map(link => (
      <GraphLinkDisplay
        key={link.getId()}
        link={link}
        detail={detail}
        labelKey={graphOptions.linkLabelProp}
        color={graphOptions.getColor(link, 'links')}
        handleClick={() => this.handleLinkClick(link)}
        actionsNode={actionsNode}
        marker={`url(#${MARKER_ID})`}
      />
    ));

    const nodesDisplay = nodes.map(node => (
      <GraphNodeDisplay
        key={node.getId()}
        node={node}
        detail={detail}
        labelKey={graphOptions.nodePreview ? 'preview' : graphOptions.nodeLabelProp}
        color={graphOptions.getColor(node, 'nodes')}
        handleClick={() => this.handleClick(node)}
        expandable={expandable[node.getId()]}
        applyDrag={this.applyDrag}
      />
    ));

    return (
      <div className="graph-wrapper">
        <GraphExpansionDialog
          node={expandNode}
          open={expansionDialogOpen}
          onClose={() => this.handleDialogClose('expansionDialogOpen')}
          links={links}
          expandExclusions={expandExclusions}
          onExpand={this.handleExpand}
          onStageAll={this.handleExpandCheckAll}
          onStage={this.handleExpandExclusion}
          onStageClass={this.handleExpandByClass}
        />
        <GraphOptionsPanel
          linkLegendDisabled={linkLegendDisabled}
          graphOptionsOpen={graphOptionsOpen}
          graphOptions={graphOptions}
          propsMap={propsMap}
          handleDialogClose={() => this.handleDialogClose('graphOptionsOpen')}
          handleGraphOptionsChange={this.handleGraphOptionsChange}
        />

        <div className="toolbar">
          <Tooltip placement="top" title="Graph options">
            <IconButton
              id="graph-options-btn"
              color="primary"
              onClick={this.openGraphOptions}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip placement="top" title="Copy share-able URL to clip-board">
            <IconButton
              id="clipboard-copy-btn"
              color="primary"
              onClick={() => copyURLToClipBoard(snackbar)}
            >
              <SaveStateIcon />
            </IconButton>
          </Tooltip>

          <Tooltip placement="top" title="Rerun Layout">
            <div className="refresh-wrapper">
              <IconButton
                color="primary"
                onClick={() => this.refresh()}
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
              <GraphArrowMarker />
            </defs>
            <g ref={(node) => { this.zoom = node; }}>
              {linksDisplay}
              {nodesDisplay}
              {actionsRing}
            </g>
          </svg>
        </div>
        <GraphLegend
          graphOptions={graphOptions}
          onChange={this.handleGraphOptionsChange}
          linkDisabled={linkLegendDisabled}
          propsMap={propsMap}
        />
      </div>
    );
  }
}

export default GraphComponent;
