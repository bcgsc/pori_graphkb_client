/**
 * @module /components/GraphComponent
 */
import { boundMethod } from 'autobind-decorator';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3Zoom from 'd3-zoom';
import * as d3Select from 'd3-selection';
import * as d3Force from 'd3-force';
import {
  IconButton,
  Tooltip,
} from '@material-ui/core';
import ViewListIcon from '@material-ui/icons/ViewList';
import SettingsIcon from '@material-ui/icons/Settings';
import RefreshIcon from '@material-ui/icons/Refresh';
import { SnackbarContext } from '@bcgsc/react-snackbar-provider';

import './GraphComponent.scss';
import GraphActionsNode from './GraphActionsNode';
import GraphOptionsPanel from './GraphOptionsPanel/GraphOptionsPanel';
import GraphLinkDisplay from './GraphLinkDisplay/GraphLinkDisplay';
import GraphNodeDisplay from './GraphNodeDisplay/GraphNodeDisplay';
import GraphArrowMarker from './GraphArrowMarker';
import GraphExpansionDialog from './GraphExpansionDialog/GraphExpansionDialog';
import GraphLegend from './GraphLegend/GraphLegend';
import util from '../../../../services/util';
import config from '../../../../static/config';
import {
  PropsMap,
  GraphOptions,
  GraphNode,
  GraphLink,
} from './kbgraph';

const {
  GRAPH_PROPERTIES: {
    NODE_INIT_RADIUS,
    ZOOM_BOUNDS,
  },
  GRAPH_DEFAULTS: {
    PALLETE_SIZE,
  },
  NOTIFICATIONS: {
    GRAPH_UNIQUE_LIMIT,
  },
} = config;

// Component specific constants.
const AUTO_SPACE_COEFFICIENT = 2;
const MARKER_ID = 'endArrow';
const DIALOG_FADEOUT_TIME = 150;
const HEAVILY_CONNECTED = 10;

/**
 * Component for displaying query results in force directed graph form.
 * Implements a d3 force-directed graph: https://github.com/d3/d3-force.
 *
 * @property {object} props
 * @property {function} props.handleClick - Parent component method triggered when a
 * graph object is clicked.
 * @property {function} props.handleDetailDrawerOpen - Method to handle opening of detail drawer.
 * @property {function} props.handleDetailDrawerClose - Method to handle closing of detail drawer.
 * @property {function} props.handleTableRedirect - Method to handle a redirect to the table view.
 * @property {function} props.handleNewColumns - Updates valid properties in parent state.
 * @property {Object} props.detail - record ID of node currently selected for detail viewing.
 * @property {Object} props.data - Parent state data.
 * in the initial query.
 * @property {Array.<string>} props.edgeTypes - list of valid edge classes.
 * @property {Array.<string>} props.displayed - list of initial record ID's to be displayed in
 * graph.
 * @property {string} props.localStorageKey - key to identify graph session data with in
 * localStorage.
 * @property {Object} props.schema - KnowledgeBase Schema.
 */
class GraphComponent extends Component {
  static contextType = SnackbarContext;

  static propTypes = {
    handleClick: PropTypes.func,
    handleDetailDrawerOpen: PropTypes.func.isRequired,
    handleDetailDrawerClose: PropTypes.func.isRequired,
    handleTableRedirect: PropTypes.func.isRequired,
    handleNewColumns: PropTypes.func.isRequired,
    search: PropTypes.string,
    cache: PropTypes.object,
    detail: PropTypes.object,
    data: PropTypes.array.isRequired,
    edgeTypes: PropTypes.arrayOf(PropTypes.string),
    displayed: PropTypes.arrayOf(PropTypes.string),
    localStorageKey: PropTypes.string,
    schema: PropTypes.object.isRequired,
    handleError: PropTypes.func.isRequired,
    handleRefresh: PropTypes.func.isRequired,
  };

  static defaultProps = {
    handleClick: null,
    search: '',
    cache: null,
    detail: null,
    edgeTypes: [],
    displayed: [],
    localStorageKey: '',
  };

  constructor(props) {
    super(props);
    this.state = {
      nodes: [],
      links: [],
      graphObjects: {},
      expandable: {},
      expandedEdgeTypes: [],
      actionsNode: null,
      simulation: d3Force.forceSimulation(),
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
  }

  /**
   * Loads edge types, initializes graph and populates it with specified input nodes.
   * Initializes event listener for window resize.
   */
  async componentDidMount() {
    const {
      displayed,
      edgeTypes,
      localStorageKey,
      handleError,
    } = this.props;
    const {
      graphOptions,
      initState,
    } = this.state;
    let { data } = this.props;
    let { expandable } = this.state;
    const allProps = this.getUniqueDataProps();
    this.propsMap = new PropsMap();


    if (data.length) {
      data = this.formatData(data);
    } else {
      // TODO update this to generate seed graph data without record selection
      const err = {
        name: 'No Seed Data',
        message: 'Please select a record from the data table for graph visualization',
      };
      handleError(err);
    }

    const expandedEdgeTypes = util.expandEdges(edgeTypes);
    let validDisplayed = displayed;
    if (!displayed || displayed.length === 0) {
      validDisplayed = Object.keys(data)[0] ? [Object.keys(data)[0]] : [];
    }

    this.setState({
      expandedEdgeTypes,
    }, () => {
      this.handleResize();
      window.addEventListener('resize', this.handleResize);

      const storedData = util.getGraphData(localStorageKey);
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
        let { nodes, links, graphObjects } = this.state;

        /* Case 1, iterate through specified rids. */
        validDisplayed.forEach((key, i) => {
          ({
            nodes,
            links,
            graphObjects,
            expandable,
          } = this.processData(
            data[key],
            util.positionInit(0, 0, i, validDisplayed.length),
            0,
            {
              nodes,
              links,
              graphObjects,
              expandable,
            },
          ));
        });
        // TODO: replace with datacache Module
        util.loadGraphData(localStorageKey, { nodes, links, graphObjects });
      } else if (initState) {
        const {
          graphObjects,
          nodes,
          links,
        } = initState;
        /* Case 2, iterate through component state field containing graph state. */
        nodes.forEach((node) => {
          this.propsMap.loadNode(node.data, allProps);
          expandable = util.expanded(expandedEdgeTypes, graphObjects, node.getId(), expandable);
        });

        links.forEach(link => this.propsMap.loadLink(link.data));

        this.setState({
          graphObjects: Object.assign({}, graphObjects),
          nodes: nodes.slice(),
          links: links.slice(),
        });
      } else if (storedData && storedData.localStorageKey === localStorageKey) {
        const {
          graphObjects,
        } = storedData;
        let { nodes, links } = storedData;
        /* Case 3, fetch state saved in localStorage. */
        delete storedData.localStorageKey;
        nodes = nodes.map((n) => {
          this.propsMap.loadNode(n.data, allProps);
          expandable = util.expanded(expandedEdgeTypes, graphObjects, n.data['@rid'], expandable);
          return new GraphNode(n.data, n.x, n.y);
        });

        links = links.map((l) => {
          this.propsMap.loadLink(l.data);
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
        this.setState({
          graphOptions: storedOptions,
          expandable,
        }, () => {
          this.drawGraph();
          this.updateColors();
        });
      } else {
        if (this.propsMap.nodeProps.length !== 0) {
          graphOptions.nodesLegend = true;
        }
        this.setState({
          graphOptions,
          expandable,
        }, () => {
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
    } = this.state;
    const { localStorageKey } = this.props;
    // remove all event listeners
    if (svg) {
      svg.call(d3Zoom.zoom()
        .on('zoom', null))
        .on('dblclick.zoom', null);
    }
    simulation.on('tick', null);
    window.removeEventListener('resize', this.handleResize);
    // TODO: replace localStorage with datacache module
    util.loadGraphData(localStorageKey, { nodes, links, graphObjects });
  }

  getUniqueDataProps() {
    let uniqueProps = [];
    const { data } = this.props;
    if (data) {
      const totalProps = [];
      data.forEach((obj) => {
        const keyArr = Object.keys(obj);
        totalProps.push(...keyArr);
      });
      uniqueProps = [...new Set(totalProps)];
      return uniqueProps;
    }
    uniqueProps = ['@rid', '@class', 'name'];
    return uniqueProps;
  }


  // TODO will be used to generate seed graph data without record selection
  async getSelectedRecordData(displayed) {
    const { cache } = this.props;
    let { search } = this.props;
    let rid = displayed[0];
    rid = rid.replace(/['"]+/g, '');
    rid = rid.replace(/[#]/g, '');

    search = `${search}&neighbors=2&@rid=${rid}`;
    const response = await cache.getRows({
      startRow: 0,
      endRow: 50,
      search,
      sortModel: [],
    });
    let recordData = {};
    recordData = this.formatData(response);
    return recordData;
  }

  // eslint-disable-next-line class-methods-use-this
  formatData(data) {
    const newData = {};
    data.forEach((obj) => {
      newData[obj['@rid']] = obj;
    });
    return newData;
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
      node.fx = d3Select.event.x; // eslint-disable-line no-param-reassign
      node.fy = d3Select.event.y; // eslint-disable-line no-param-reassign
    };

    const ended = () => {
      if (!d3Select.event.active) simulation.alphaTarget(0);
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
      d3Force
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
  @boundMethod
  initSimulation() {
    const {
      simulation,
      graphOptions,
      width,
      height,
    } = this.state;
    simulation.force(
      'link',
      d3Force.forceLink().id(d => d.getId()),
    ).force(
      'collide',
      d3Force.forceCollide((d) => {
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
      d3Force.forceManyBody()
        .strength(-graphOptions.chargeStrength)
        .distanceMax(graphOptions.chargeMax),
    ).force(
      'center',
      d3Force.forceCenter(
        width / 2,
        height / 2,
      ),
    );

    const container = d3Select.select(this.zoom);
    const svg = d3Select.select(this.graph);

    svg
      .attr('width', width)
      .attr('height', height)
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
  }

  /**
   * Calls the api and renders neighbor nodes of the input node onto the graph.
   * @param {GraphNode} node - d3 simulation node whose neighbors were requestsed.
   */
  @boundMethod
  loadNeighbors(node) {
    const { expandExclusions } = this.state;
    let {
      nodes,
      links,
      graphObjects,
      expandable,
    } = this.state;
    const { schema, localStorageKey } = this.props;
    let { data } = this.props;

    data = this.formatData(data);


    if (expandable[node.getId()] && data[node.getId()]) {
      ({
        nodes,
        links,
        graphObjects,
        expandable,
      } = this.processData(
        data[node.getId()],
        { x: node.x, y: node.y },
        1,
        {
          nodes,
          links,
          graphObjects,
          expandable,
        },
        expandExclusions,
      ));
      this.drawGraph();
      this.updateColors();
    }
    if (!schema.getEdges(data[node.getId()]).some(edge => !links.find(l => l.getId() === edge['@rid']))) {
      delete expandable[node.getId()];
    }
    // replace localStorage with datacache module
    util.loadGraphData(localStorageKey, { nodes, links, graphObjects });
    this.setState({
      expandable,
      actionsNode: null,
      refreshable: true,
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
    } = this.state;
    const { schema } = this.props;
    let { data } = this.props;
    data = this.formatData(data);

    if (expandable[node.getId()] && data[node.getId()]) {
      if (schema.getEdges(data[node.getId()])
        .filter(edge => !(links.find(l => l.getId() === edge['@rid']))).length > HEAVILY_CONNECTED
      ) {
        this.setState({ expandNode: data[node.getId()] },
          this.handleDialogOpen('expansionDialogOpen'));
      } else {
        this.loadNeighbors(node);
      }
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

  /**
   * Processes node data and updates state with new nodes and links. Also
   * updates expandable flags.
   * @param {Object} node - Node object as returned by the api.
   * @param {Object} position - Object containing x and y position of node.
   * @param {number} depth - Recursion base case flag.
   * @param {Object} prevstate - Object containing nodes, links,
   * graphobjects, and expandable map, from previous state.
   * @param {Array.<string>} [exclusions=[]] - List of edge ID's to be ignored on expansion.
   */
  processData(node, position, depth, prevstate, exclusions = []) {
    const { expandedEdgeTypes } = this.state;
    let {
      nodes,
      links,
      graphObjects,
      expandable,
    } = prevstate;
    const { handleNewColumns } = this.props;
    let { data } = this.props;
    data = this.formatData(data);

    if (data[node['@rid'] || data[node.getId()]]) {
      node = data[node['@rid'] || data[node.getId()]]; // eslint-disable-line no-param-reassign
    } else {
      // Node properties haven't been processed.
      handleNewColumns(node);
    }

    const allProps = this.getUniqueDataProps();

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
                ({
                  nodes,
                  links,
                  expandable,
                  graphObjects,
                } = this.processData(
                  edge.out,
                  positionInit,
                  depth - 1,
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
                const positionInit = util.positionInit(
                  position.x,
                  position.y,
                  i += 1,
                  n,
                );
                ({
                  nodes,
                  links,
                  expandable,
                  graphObjects,
                } = this.processData(
                  edge.in,
                  positionInit,
                  depth - 1,
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
                expandable = util.expanded(expandedEdgeTypes, graphObjects, targetRid, expandable);
              }
            } else {
              // If there are unrendered edges, set expandable flag.
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
   * Restarts simulation with initial nodes and links present. These are determined by the
   * first state rendered when the component mounts.
   */
  @boundMethod
  refresh() {
    const { handleDetailDrawerClose, handleRefresh } = this.props;
    handleRefresh();
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
  @boundMethod
  updateColors() {
    const snackbar = this.context;
    ['node', 'link'].forEach((type) => {
      const { [`${type}s`]: objs, graphOptions } = this.state;
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
        if (tooManyUniques) {
          snackbar.add(`${GRAPH_UNIQUE_LIMIT} (${graphOptions[`${type}sColor`]})`);
        }

        graphOptions[`${type}sColor`] = '';
        this.setState({ graphOptions }, () => this.updateColors());
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
   * @param {function} action - callback function to be called before node is
   * deselected.
   */
  @boundMethod
  withClose(action = null) {
    return () => {
      if (action) {
        action();
      }
      this.setState({ actionsNode: null });
    };
  }

  /**
   * Handles node clicks from user.
   * @param {Object} node - Clicked simulation node.
   */
  @boundMethod
  async handleClick(node) {
    const { handleClick, handleDetailDrawerOpen } = this.props;
    // Prematurely loads neighbor data.
    await handleClick(node);

    // Update contents of detail drawer if open.
    handleDetailDrawerOpen(node);
    // Sets clicked object as actions node.
    this.setState({ actionsNode: node, actionsNodeIsEdge: false });
  }

  /**
   * Updates graph options, re-initializes simulation, and re-renders objects.
   * @param {Event} event - User input event.
   * @param {boolean} isAdvanced - Advanced option flag.
   */
  @boundMethod
  handleGraphOptionsChange(event, isAdvanced) {
    const { graphOptions, refreshable } = this.state;
    graphOptions[event.target.name] = event.target.value;
    graphOptions.load();
    this.setState({ graphOptions, refreshable: isAdvanced || refreshable }, () => {
      this.initSimulation();
      this.drawGraph();
      this.updateColors();
    });
  }

  /**
   * Closes additional help dialog.
   */
  @boundMethod
  handleDialogClose(key) {
    return () => this.setState({ [key]: false },
      () => {
        this.drawGraph();
        setTimeout(() => this.setState({ expandExclusions: [] }), DIALOG_FADEOUT_TIME);
      });
  }

  /**
   * Opens additional help dialog.
   * @param {string} key - ['main', 'advanced'].
   */
  @boundMethod
  handleDialogOpen(key) {
    return () => this.setState({ [key]: true }, () => {
      this.pauseGraph();
    });
  }

  /**
   * Expands currently staged nodes.
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
    this.setState({ actionsNode: link, actionsNodeIsEdge: true });
  }

  /**
   * Hides link from the graph view.
   */
  @boundMethod
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
  @boundMethod
  handleNodeHide() {
    const {
      actionsNode,
      graphObjects,
      nodes,
      links,
      expandedEdgeTypes,
      expandable,
    } = this.state;
    const { localStorageKey } = this.props;
    const allProps = this.getUniqueDataProps();

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
      // TODO: replace localStorage with datacache module
      util.loadGraphData(localStorageKey, { nodes, links, graphObjects });
    });
  }

  /**
   * Resizes svg window and reinitializes the simulation.
   */
  @boundMethod
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
    const { schema } = this.props;
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
      const { schema } = this.props;
      const expandExclusions = [];
      schema.getEdges(expandNode).forEach((edge) => {
        if (edge['@class'] !== cls) {
          expandExclusions.push(edge['@rid']);
        }
      });
      this.setState({ expandExclusions });
    };
  }

  render() {
    const {
      nodes,
      links,
      actionsNode,
      expandable,
      graphOptions,
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
      schema,
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

    const actionsRingOptions = actionsNodeIsEdge
      ? [
        {
          name: 'Details',
          action: this.withClose(() => handleDetailDrawerOpen(actionsNode, true, true)),
          disabled: link => link.getId() === (detail || {})['@rid'],
        },
        {
          name: 'Hide',
          action: this.withClose(this.handleLinkHide),
          disabled: false,
        }] : [
        {
          name: 'Details',
          action: this.withClose(() => handleDetailDrawerOpen(actionsNode, true)),
          disabled: node => node.getId() === (detail || {})['@rid'],
        },
        {
          name: 'Close',
          action: this.withClose(),
        },
        {
          name: 'Expand',
          action: () => this.handleExpandRequest(actionsNode),
          disabled: node => !expandable[node.getId()],
        },
        {
          name: 'Hide',
          action: this.withClose(this.handleNodeHide),
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
        schema={schema}
      />
    ));

    return (
      <div className="graph-wrapper">
        <GraphExpansionDialog
          schema={schema}
          node={expandNode}
          open={expansionDialogOpen}
          onClose={this.handleDialogClose('expansionDialogOpen')}
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
          handleDialogClose={this.handleDialogClose}
          handleGraphOptionsChange={this.handleGraphOptionsChange}
        />

        <div className="toolbar">
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
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          <Tooltip placement="top" title="Restart simulation with initial nodes">
            <div className="refresh-wrapper">
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
