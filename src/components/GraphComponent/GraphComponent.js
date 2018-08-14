import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './GraphComponent.css';
import * as d3 from 'd3';
import queryString from 'query-string';
import {
  Checkbox,
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  Typography,
  Paper,
  Select,
  MenuItem,
  InputLabel,
  Input,
  FormControl,
  Popper,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Snackbar,
  Button,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import ViewListIcon from '@material-ui/icons/ViewList';
import BuildIcon from '@material-ui/icons/Build';
import RefreshIcon from '@material-ui/icons/Refresh';
import HelpIcon from '@material-ui/icons/Help';
import SaveIcon from '@material-ui/icons/Save';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { withStyles } from '@material-ui/core/styles';
import GraphLink from '../GraphLink/GraphLink';
import GraphNode from '../GraphNode/GraphNode';
import util from '../../services/util';
import config from '../../config.json';
import GraphActionsNode from '../GraphActionsNode/GraphActionsNode';

const {
  ARROW_WIDTH,
  ARROW_LENGTH,
  NODE_INIT_RADIUS,
  NODE_RADIUS,
} = config.GRAPH_PROPERTIES;

const {
  LINK_STRENGTH,
  CHARGE_STRENGTH,
  DEFAULT_NODE_COLOR,
  PALLETE_SIZES,
} = config.GRAPH_DEFAULTS;

const { GRAPH_ADVANCED, GRAPH_MAIN } = config.DESCRIPTIONS;

const styles = {
  paper: {
    width: '500px',
    '@media (max-width: 768px)': { width: 'calc(100% - 1px)' },
  },
  root: {
    margin: '3px 0 0 -15px',
  },
  label: {
    'margin-left': '-8px',
    'font-size': '0.9em',
  },
};

const END_ARROW_SIZE = {
  d: `M0,0,L0,${ARROW_WIDTH} L ${ARROW_LENGTH}, ${ARROW_WIDTH / 2} z`,
  refX: 2 * ARROW_LENGTH + 2,
  refY: ARROW_WIDTH / 2,
};

const AUTO_SPACE_COEFFICIENT = 2.8;

/**
 * Component for displaying query results in force directed graph form.
 */
class GraphComponent extends Component {
  static positionInit(x, y, i, n) {
    const newX = NODE_INIT_RADIUS * Math.cos((2 * Math.PI * i - Math.PI / 6) / n) + x;
    const newY = NODE_INIT_RADIUS * Math.sin((2 * Math.PI * i - Math.PI / 6) / n) + y;
    return { x: newX, y: newY };
  }

  constructor(props) {
    super(props);
    this.state = {
      nodes: [],
      links: [],
      graphObjects: {},
      propsMap: { nodes: {}, links: {} },
      expandedEdgeTypes: [],
      simulation: null,
      svg: undefined,
      width: 0,
      height: 0,
      graphOptions: {
        defaultColor: DEFAULT_NODE_COLOR,
        linkStrength: LINK_STRENGTH,
        chargeStrength: CHARGE_STRENGTH,
        collisionRadius: NODE_RADIUS,
        autoCollisionRadius: false,
        linkHighlighting: true,
        nodeLabelProp: 'name',
        linkLabelProp: '',
        nodesColor: '@class',
        linksColor: '',
        nodesColors: {},
        linksColors: {},
      },
      graphOptionsOpen: false,
      mainHelp: false,
      advancedHelp: false,
      expandable: {},
      actionsNode: null,
    };

    this.drawGraph = this.drawGraph.bind(this);
    this.initSimulation = this.initSimulation.bind(this);
    this.loadNeighbors = this.loadNeighbors.bind(this);
    this.updateColors = this.updateColors.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleGraphOptionsChange = this.handleGraphOptionsChange.bind(this);
    this.handleOptionsPanelOpen = this.handleOptionsPanelOpen.bind(this);
    this.handleOptionsPanelClose = this.handleOptionsPanelClose.bind(this);
    this.handleActionsRing = this.handleActionsRing.bind(this);
    this.handleNodeHide = this.handleNodeHide.bind(this);
    this.handleGraphColorsChange = this.handleGraphColorsChange.bind(this);
    this.handleHelpOpen = this.handleHelpOpen.bind(this);
    this.handleHelpClose = this.handleHelpClose.bind(this);
    this.handleSaveGraph = this.handleSaveGraph.bind(this);
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
      allColumns,
      filteredSearch,
      edges,
    } = this.props;
    const { propsMap, expandable, graphOptions } = this.state;
    const simulation = d3.forceSimulation();
    // Defines what edge keys to look for.
    const expandedEdgeTypes = edges.reduce((r, e) => {
      r.push(`in_${e}`);
      r.push(`out_${e}`);
      return r;
    }, []);

    let validDisplayed = displayed;
    if (!displayed || displayed.length === 0) {
      validDisplayed = [Object.keys(data)[0]];
    }
    const stringifiedSearch = queryString.stringify(filteredSearch);
    this.setState({
      expandedEdgeTypes,
      schema,
      simulation,
      allColumns,
      filteredSearch: stringifiedSearch,
    }, () => {
      this.handleResize();
      window.addEventListener('resize', this.handleResize);

      const storedData = util.getGraphData(stringifiedSearch);
      const storedOptions = util.getGraphOptions();

      if (
        storedData
        && (!displayed || displayed.length === 0)
      ) {
        const {
          graphObjects,
          nodes,
        } = storedData;
        delete storedData.filteredSearch;
        nodes.forEach((node) => {
          util.loadColorProps(allColumns, node.data, propsMap);
          util.expanded(expandedEdgeTypes, graphObjects, node.data['@rid'], expandable);
        });
        this.setState(
          {
            ...storedData,
            icon: true,
          },
        );
      } else {
        validDisplayed.forEach((key, i) => {
          this.processData(
            data[key],
            GraphComponent.positionInit(0, 0, i, validDisplayed.length),
            0,
          );
        });
      }

      if (storedOptions) {
        this.setState({ ...storedOptions }, () => {
          this.drawGraph();
          this.updateColors('nodes');
          this.updateColors('links');
        });
      } else {
        if (propsMap.nodes.length !== 0) {
          graphOptions.nodesLegend = true;
        }
        this.setState({ graphOptions }, () => {
          this.drawGraph();
          this.updateColors('nodes');
          this.updateColors('links');
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
    } = this.state;
    const { data } = this.props;

    if (expandable[node.data['@rid']] && data[node.data['@rid']]) {
      this.processData(
        data[node.data['@rid']],
        { x: node.x, y: node.y },
        1,
      );
      this.drawGraph();
      this.updateColors('nodes');
      this.updateColors('links');
    }

    delete expandable[node.data['@rid']];
    util.loadGraphData(filteredSearch, { nodes, links, graphObjects });
    this.setState({ expandable, actionsNode: null });
  }

  /**
   * Processes node data and updates state with new nodes and links.
   * Returns updated nodes, links, and graphObjects. Also updates expandable flags.
   * @param {Object} node - Node object as returned by the api.
   * @param {Object} position - Object containing x and y position of input node.
   * @param {number} depth - Recursion base case flag.
   */
  processData(node, position, depth) {
    const {
      expandedEdgeTypes,
      expandable,
      nodes,
      links,
      graphObjects,
      propsMap,
    } = this.state;

    const { data, handleNewColumns } = this.props;

    if (data[node['@rid']]) {
      node = data[node['@rid']];
    } else {
      // Node properties haven't been processed.
      handleNewColumns(node);
    }
    const { allColumns } = this.props;

    if (!graphObjects[node['@rid']]) {
      nodes.push({
        data: node,
        x: position.x,
        y: position.y,
      });
      graphObjects[node['@rid']] = node;
      util.loadColorProps(allColumns, node, propsMap);
    }

    let flag = false;
    expandedEdgeTypes.forEach((edgeType) => {
      if (node[edgeType] && node[edgeType].length !== 0) {
        // stores total number of edges and initializes count for position calculating.
        const n = node[edgeType].length;
        let j = 0;

        // Looks through each edge of certain type.
        node[edgeType].forEach((edge) => {
          const edgeRid = edge['@rid'] || edge;

          // Checks if edge is already rendered in the graph
          if (!graphObjects[edgeRid]) {
            const inRid = (edge.in || {})['@rid'] || edge.in;
            const outRid = (edge.out || {})['@rid'] || edge.out;
            const targetRid = inRid === node['@rid'] ? outRid : inRid;
            // TODO: Remove once statements are stable.
            if (edge.out['@class'] === 'Statement' || edge.in['@class'] === 'Statement') {
              return;
            }
            if (
              edge['@rid']
              && inRid
              && outRid
              && (depth > 0 || graphObjects[targetRid])
            ) {
              // Initialize new link object and pushes to links list.
              const link = {
                source: outRid,
                target: inRid,
                data: {
                  source: edge.source,
                  '@class': edge['@class'],
                  '@rid': edge['@rid'],
                },
              };
              links.push(link);
              graphObjects[link.data['@rid']] = link;

              if (!propsMap.links['source.name']) {
                propsMap.links['source.name'] = [];
              }
              if (!propsMap.links['source.name'].includes(link.data.source.name)) {
                propsMap.links['source.name'].push(link.data.source.name);
              }
              if (!propsMap.links['@class']) {
                propsMap.links['@class'] = [];
              }
              if (!propsMap.links['@class'].includes(link.data['@class'])) {
                propsMap.links['@class'].push(link.data['@class']);
              }

              // Checks if node is already rendered
              if (outRid && !graphObjects[outRid]) {
                // Initializes position of new child
                const positionInit = GraphComponent.positionInit(
                  position.x,
                  position.y,
                  j += 1,
                  n,
                );
                this.processData(
                  edge.out,
                  positionInit,
                  depth - 1,
                );
              }
              if (inRid && !graphObjects[inRid]) {
                const positionInit = GraphComponent.positionInit(
                  position.x,
                  position.y,
                  j += 1,
                  n,
                );
                this.processData(
                  edge.in,
                  positionInit,
                  graphObjects,
                  depth - 1,
                );
              }

              // Updates expanded on target node.
              if (expandable[targetRid]) {
                util.expanded(expandedEdgeTypes, graphObjects, targetRid, expandable);
              }
            } else {
              // If there are unrendered edges, set expandable flag.
              flag = true;
            }
          }
        });
      }
    });
    expandable[node['@rid']] = flag;

    this.setState({
      expandable,
      nodes,
      links,
      graphObjects,
      propsMap,
    });
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
      this.setState({ width: w, height: h }, this.initSimulation);
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
    this.setState({ graphOptionsOpen: true });
  }

  /**
   * Closes graph options dialog.
   */
  handleOptionsPanelClose() {
    this.setState({ graphOptionsOpen: false });
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
      d3.forceLink().id(d => d.data['@rid']),
    ).force(
      'collide',
      d3.forceCollide((d) => {
        if (graphOptions.autoCollisionRadius) {
          let obj = d.data;
          let key = graphOptions.nodeLabelProp;
          if (key.includes('.')) {
            key = key.split('.')[1];
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
        .scaleExtent([0.2, 10])
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
   * Renders nodes and links to the graph.
   * @param {boolean} reset - Reset flag to determine whether or not to re-
   * initialize node positions.
   */
  drawGraph(reset) {
    if (reset) {
      this.setState({ nodes: [], links: [], graphObjects: [] }, this.componentDidMount);
    }

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
    this.setState({ simulation, actionsNode: null });
  }

  /**
   * Updates color scheme for the graph, for nodes or links.
   * @param {string} type - Object type (nodes or links)
   */
  updateColors(type) {
    const objs = this.state[type];
    const { graphOptions, propsMap } = this.state;
    const key = graphOptions[`${type}Color`];
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

    if (
      (Object.keys(colors).length > PALLETE_SIZES[PALLETE_SIZES.length - 1]
        && Object.keys(propsMap[type]).length !== 1)
      || (propsMap[type][key]
      && (propsMap[type][key].length === 0
        || (propsMap[type][key].length === 1 && propsMap[type][key].includes('null'))))
    ) {
      graphOptions[`${type}Color`] = '';
      this.setState({ graphOptions, snackbarOpen: true }, () => this.updateColors(type));
    } else {
      const pallette = util.getPallette(Object.keys(colors).length, type);
      Object.keys(colors).forEach((color, i) => { colors[color] = pallette[i]; });

      graphOptions[`${type}Colors`] = colors;
      graphOptions[`${type}Pallette`] = pallette;
      this.setState({ graphOptions });
    }
    /* eslint-enable */
  }

  /**
   * Updates node colors or retrieves node neighbors.
   * @param {Event} e - User click event.
   * @param {Object} node - Clicked simulation node.
   */
  async handleClick(e, node) {
    const { handleClick, handleDetailDrawerOpen } = this.props;

    await handleClick(node.data['@rid'], node.data['@class']);

    handleDetailDrawerOpen(node);
    this.setState({ actionsNode: node });
  }

  /**
   * Updates graph options, re-initializes simulation, and re-renders objects.
   * @param {Event} e - User input event.
   */
  handleGraphOptionsChange(e) {
    const { graphOptions } = this.state;
    graphOptions[e.target.name] = e.target.value;
    this.setState({ graphOptions, icon: false }, () => {
      this.initSimulation();
      this.drawGraph();
    });
  }

  /**
   * Handles color sort property changes.
   * @param {Event} e - property change event.
   * @param {string} type - defines which graph object type to change [nodes, links].
   */
  handleGraphColorsChange(e, type) {
    const { graphOptions } = this.state;
    graphOptions[`${type}Color`] = e.target.value;
    this.setState({ graphOptions, icon: null }, () => this.updateColors(type));
  }

  /**
   * Handles user selections within the actions ring.
   */
  handleActionsRing(action) {
    action();
    this.setState({ actionsNode: null });
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
      propsMap,
      allColumns,
      graphOptions,
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
            delete graphObjects[edgeRid];
            expandable[targetRid] = true;
          }
        });
      }
    });

    allColumns.forEach((prop) => {
      let obj = actionsNode.data;
      let key = prop;

      // Nested prop condition
      if (prop.includes('.')) {
        key = prop.split('.')[1];
        obj = actionsNode.data[prop.split('.')[0]] || {};
      }
      if (
        propsMap.nodes[prop]
        && obj[key]
        && !nodes.find((n) => {
          let nObj = n.data;

          // Nested prop condition
          if (prop.includes('.')) {
            nObj = n.data[prop.split('.')[0]] || {};
          }
          return nObj[key] === obj[key];
        })
      ) {
        const j = propsMap.nodes[prop].indexOf(obj[key]);
        propsMap.nodes[prop].splice(j, 1);
        if (
          propsMap.nodes[prop].length === 0
          || (propsMap.nodes[prop].length === 1
            && propsMap.nodes[prop].includes('null'))
        ) {
          if (graphOptions.nodesColor === prop) graphOptions.nodesColor = '';
          if (graphOptions.nodeLabelProp === prop) graphOptions.nodeLabelProp = '';

          this.setState({ graphOptions });
        }
      }
    });
    this.setState({
      expandable,
      nodes,
      links,
      graphObjects,
      actionsNode: null,
      propsMap,
    }, () => {
      this.updateColors('nodes');
      this.updateColors('links');
      handleDetailDrawerClose();
      util.loadGraphData(filteredSearch, { nodes, links, graphObjects });
    });
  }

  /**
   * Opens additional help dialog.
   * @param {string} helpType - ['main', 'advanced'].
   */
  handleHelpOpen(helpType) {
    this.setState({ [`${helpType}Help`]: true });
  }

  /**
   * Closes additional help dialog.
   */
  handleHelpClose() {
    this.setState({ advancedHelp: false, mainHelp: false });
  }

  /**
   * Loads graph data into localstorage, and notifies indicator.
   */
  handleSaveGraph() {
    const {
      graphOptions,
      propsMap,
    } = this.state;
    util.loadGraphOptions({
      graphOptions,
      propsMap,
    });
    this.setState({ icon: true });
  }

  render() {
    const {
      nodes,
      links,
      actionsNode,
      expandable,
      graphOptions,
      simulation,
      graphOptionsOpen,
      propsMap,
      snackbarOpen,
      mainHelp,
      advancedHelp,
      icon,
    } = this.state;

    const {
      classes,
      handleTableRedirect,
      detail,
      handleDetailDrawerClose,
      handleDetailDrawerOpen,
    } = this.props;

    if (!simulation) return null;

    const helpPanel = (
      <Dialog
        open={advancedHelp || mainHelp}
        onClose={() => this.handleHelpClose()}
      >
        <DialogTitle disableTypography className="advanced-title">
          <Typography variant="headline">
            {advancedHelp ? 'Advanced Graph Options Help' : 'Graph Options Help'}
          </Typography>
          <IconButton onClick={() => this.handleHelpClose()}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {(advancedHelp ? GRAPH_ADVANCED : GRAPH_MAIN).map(help => (
            <React.Fragment key={help.title}>
              <Typography variant="title" gutterBottom>
                {help.title}
              </Typography>
              <Typography variant="body1" paragraph>
                {help.description}
              </Typography>
            </React.Fragment>
          ))}
        </DialogContent>
      </Dialog>
    );

    const graphOptionsPanel = (
      <Dialog
        open={graphOptionsOpen}
        onClose={this.handleOptionsPanelClose}
        classes={{
          paper: 'options-panel-wrapper',
        }}
      >
        <IconButton
          onClick={this.handleOptionsPanelClose}
          id="options-close-btn"
        >
          <CloseIcon />
        </IconButton>
        <DialogTitle className="advanced-title" disableTypography>
          <Typography variant="title">Graph Options</Typography>
          <HelpIcon color="primary" onClick={() => this.handleHelpOpen('main')} />
        </DialogTitle>
        <DialogContent>
          <div className="main-options-wrapper">
            <FormControl className="graph-option">
              <InputLabel htmlFor="nodeLabelProp">Label nodes by</InputLabel>
              <Select
                name="nodeLabelProp"
                input={<Input name="nodeLabelProp" id="nodeLabelProp" />}
                onChange={this.handleGraphOptionsChange}
                value={graphOptions.nodeLabelProp}
              >
                <MenuItem value="">None</MenuItem>
                {Object.keys(propsMap.nodes).map((prop) => {
                  if (propsMap.nodes[prop]
                    && !(propsMap.nodes[prop].length === 1 && propsMap.nodes[prop].includes('null'))
                  ) {
                    return (
                      <MenuItem value={prop} key={prop}>
                        {util.antiCamelCase(prop)}
                      </MenuItem>
                    );
                  }
                  return null;
                })}
              </Select>
            </FormControl>
            <FormControl className="graph-option">
              <InputLabel htmlFor="nodesColor">Color nodes by</InputLabel>
              <Select
                name="nodesColor"
                input={<Input name="nodesColor" id="nodesColor" />}
                onChange={e => this.handleGraphColorsChange(e, 'nodes')}
                value={graphOptions.nodesColor}
              >
                <MenuItem value="">None</MenuItem>
                {Object.keys(propsMap.nodes).map((prop) => {
                  if (
                    propsMap.nodes[prop]
                    && propsMap.nodes[prop].length <= 20
                    && !(propsMap.nodes[prop].length === 1 && propsMap.nodes[prop].includes('null'))
                  ) {
                    return (
                      <MenuItem value={prop} key={prop}>
                        {util.antiCamelCase(prop)}
                      </MenuItem>
                    );
                  }
                  return null;
                })}
              </Select>
            </FormControl>
          </div>
          <div className="main-options-wrapper">
            <FormControl className="graph-option">
              <InputLabel htmlFor="linkLabelProp">Label edges by</InputLabel>
              <Select
                input={<Input name="linkLabelProp" id="linkLabelProp" />}
                onChange={this.handleGraphOptionsChange}
                value={graphOptions.linkLabelProp}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="@class">Class</MenuItem>
                <MenuItem value="source.name">Source Name</MenuItem>
              </Select>
            </FormControl>
            <FormControl className="graph-option">
              <InputLabel htmlFor="linksColor">Color edges by</InputLabel>
              <Select
                input={<Input name="linksColor" id="linksColor" />}
                onChange={e => this.handleGraphColorsChange(e, 'links')}
                value={graphOptions.linksColor}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="@class">Class</MenuItem>
                <MenuItem value="source.name">Source Name</MenuItem>
              </Select>
            </FormControl>
          </div>
          <div className="main-options-wrapper">
            <FormControl className="graph-option">
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
                    name="nodesLegend"
                    checked={!!(graphOptions.nodesLegend && graphOptions.nodesColor)}
                  />
                )}
                label="Show Nodes Coloring Legend"
              />
            </FormControl>
            <FormControl>
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
                    name="linksLegend"
                    checked={!!(
                      graphOptions.linksLegend
                      && graphOptions.linksColor
                      && links.length !== 0
                    )}
                  />
                )}
                label="Show Links Coloring Legend"
              />
            </FormControl>
          </div>
          <Divider />
          <div className="advanced-options-wrapper">
            <div className="advanced-title">
              <Typography variant="title">
                Advanced Graph Options
              </Typography>
              <HelpIcon color="primary" onClick={() => this.handleHelpOpen('advanced')} />
            </div>
            <div className="advanced-options-grid">
              <div className="graph-input-wrapper">
                <InputLabel htmlFor="linkStrength" style={{ fontSize: '0.75rem' }}>
                  Link Strength
                </InputLabel>
                <Input
                  name="linkStrength"
                  type="number"
                  id="linkStrength"
                  value={graphOptions.linkStrength}
                  onChange={this.handleGraphOptionsChange}
                  inputProps={{
                    max: 1,
                    step: 0.001,
                  }}
                />
              </div>
              <div className="graph-input-wrapper">
                <InputLabel htmlFor="chargeStrength" style={{ fontSize: '0.75rem' }}>
                  Charge Strength
                </InputLabel>
                <Input
                  label="Charge Strength"
                  name="chargeStrength"
                  type="number"
                  id="chargeStrength"
                  value={graphOptions.chargeStrength}
                  onChange={this.handleGraphOptionsChange}
                  inputProps={{
                    max: 1000,
                    step: 1,
                  }}
                />
              </div>
              <div className="graph-input-wrapper">
                <InputLabel htmlFor="collisionRadius" style={{ fontSize: '0.75rem' }}>
                  Collision Radius
                </InputLabel>
                <Input
                  label="Collision Radius"
                  name="collisionRadius"
                  id="collisionRadius"
                  type="number"
                  value={graphOptions.collisionRadius}
                  onChange={this.handleGraphOptionsChange}
                  inputProps={{
                    max: 100,
                    step: 1,
                  }}
                />
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
                  label="Auto Space Nodes"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );

    const legend = (
      <Popper
        open={
          !!(graphOptions.nodesLegend && graphOptions.nodesColor)
          || !!(graphOptions.linksLegend && graphOptions.linksColor)
        }
      >
        <div className="legend-wrapper">
          {graphOptions.nodesLegend && graphOptions.nodesColor ? (
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
                  {(propsMap.nodes[graphOptions.nodesColor] || []).includes('null') ? (
                    <ListItem key="null">
                      <ListItemIcon>
                        <div
                          style={{ backgroundColor: graphOptions.defaultColor }}
                          className="color-chip"
                        />
                      </ListItemIcon>
                      <ListItemText primary="Null" />
                    </ListItem>
                  ) : null}
                </List>
              </div>
            </Paper>) : null}
          {!!(graphOptions.linksLegend && graphOptions.linksColor) && links.length !== 0 ? (
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
                  {graphOptions.linksColor ? `(${util.antiCamelCase(graphOptions.linksColor)})` : ''}
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
                  {(propsMap.links[graphOptions.linksColor] || []).includes('null') ? (
                    <ListItem key="null">
                      <ListItemIcon>
                        <div
                          style={{ backgroundColor: graphOptions.defaultColor }}
                          className="color-chip"
                        />
                      </ListItemIcon>
                      <ListItemText primary="Null" />
                    </ListItem>
                  ) : null}
                </List>
              </div>
            </Paper>) : null}
        </div>
      </Popper>
    );

    const snackbar = (
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={snackbarOpen}
        onClose={() => this.setState({ snackbarOpen: false })}
        autoHideDuration={6000}
        message={(
          <span>
            Too many subgroups, choose new coloring property.
          </span>
        )}
        action={(
          <Button color="secondary" onClick={() => this.setState({ snackbarOpen: false })}>
            Ok
          </Button>
        )}
      />

    );

    const actionsRing = () => {
      const options = [
        {
          name: 'Details',
          icon: <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />,
          action: () => handleDetailDrawerOpen(actionsNode, true),
          disabled: node => node.data['@rid'] === detail,
        },
        {
          name: 'Close',
          icon: <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />,
          action: () => this.setState({ actionsNode: null }),
        },
        {
          name: 'Expand',
          icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />,
          action: () => this.loadNeighbors(actionsNode),
          disabled: node => !expandable[node.data['@rid']],
        },
        {
          name: 'Hide',
          icon: <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />,
          action: this.handleNodeHide,
          disabled: () => nodes.length === 1,
        },
      ];
      return (
        <GraphActionsNode
          options={options}
          handleActionsRing={this.handleActionsRing}
          actionsNode={actionsNode}
        />
      );
    };

    const linksDisplay = links.map((link) => {
      let linkColorKey = '';
      if (graphOptions.linksColor && graphOptions.linksColor.includes('.')) {
        const keys = graphOptions.linksColor.split('.');
        linkColorKey = (link.data[keys[0]] || {})[keys[1]];
      } else if (graphOptions.linksColor) {
        linkColorKey = link.data[graphOptions.linksColor];
      }
      const color = graphOptions.linksColors[linkColorKey];

      return (
        <GraphLink
          key={link.data['@rid']}
          link={link}
          detail={detail}
          labelKey={graphOptions.linkLabelProp}
          color={color}
        />
      );
    });

    const nodesDisplay = nodes.map((node) => {
      let nodeColorKey = '';
      if (graphOptions.nodesColor && graphOptions.nodesColor.includes('.')) {
        const keys = graphOptions.nodesColor.split('.');
        nodeColorKey = (node.data[keys[0]] || {})[keys[1]];
      } else if (graphOptions.nodesColor) {
        nodeColorKey = node.data[graphOptions.nodesColor];
      }
      const color = graphOptions.nodesColors[nodeColorKey];

      const isExpandable = expandable[node.data['@rid']];
      return (
        <GraphNode
          key={`node${node.data['@rid']}`}
          node={node}
          simulation={simulation}
          color={color}
          r={NODE_RADIUS}
          handleClick={e => this.handleClick(e, node)}
          expandable={isExpandable}
          actionsRing={actionsNode === node ? actionsRing() : null}
          label={graphOptions.nodeLabelProp}
          detail={detail}
        />
      );
    });

    return (
      <div className="graph-wrapper">
        {snackbar}
        {helpPanel}
        {graphOptionsPanel}
        {legend}
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
              onClick={this.handleOptionsPanelOpen}
              style={{
                margin: 'auto 8px',
              }}
            >
              <BuildIcon />
            </IconButton>
          </Tooltip>

          <Tooltip placement="top" title="Restart simulation with initial nodes">
            <IconButton
              color="primary"
              onClick={() => {
                this.initSimulation();
                this.drawGraph(true);
                handleDetailDrawerClose();
              }}
              style={{
                margin: 'auto 8px',
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Tooltip placement="top" title={!icon ? 'Save graph state' : 'Saved!'}>
            <div className="save-check">
              {!icon ? (
                <IconButton
                  color="primary"
                  onClick={this.handleSaveGraph}
                >
                  <SaveIcon />
                </IconButton>
              )
                : (
                  <CheckCircleIcon
                    color="secondary"
                    style={{
                      margin: 'auto',
                    }}
                  />
                )}
            </div>
          </Tooltip>
        </div>

        <div className="svg-wrapper" ref={(node) => { this.wrapper = node; }}>
          <svg
            ref={(node) => { this.graph = node; }}
            onClick={() => this.setState({ actionsNode: null })}
          >
            <defs>
              <marker
                id="endArrow"
                markerWidth={ARROW_LENGTH}
                markerHeight={ARROW_WIDTH}
                refX={END_ARROW_SIZE.refX}
                refY={END_ARROW_SIZE.refY}
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d={END_ARROW_SIZE.d} fill="#555" />
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

/**
  * @param {function} handleClick - Parent component method triggered when a
  * graph object is clicked.
  * @param {Object} data - Parent state data.
  * @param {function} handleDetailDrawerOpen - Method to handle opening of detail drawer.
  * @param {function} handleDetailDrawerClose - Method to handle closing of detail drawer.
  * @param {function} handleTableRedirect - Method to handle a redirect to the table view.
  * @param {Array} edgeTypes - Array containing all the different edge types as defined by
  * the database schema.
  * @param {Array} ontologyTypes - Array containing individual schemas for each Ontology
  * subclass as defined by the schema.
  * @param {string} detail - record ID of node currently selected for detail viewing.
  * @param {Array} allColumns - list of all unique properties on all nodes returned in
  * initial query.
  */
GraphComponent.propTypes = {
  handleClick: PropTypes.func,
  data: PropTypes.object.isRequired,
  classes: PropTypes.object,
  handleDetailDrawerOpen: PropTypes.func.isRequired,
  handleDetailDrawerClose: PropTypes.func.isRequired,
  handleTableRedirect: PropTypes.func.isRequired,
  handleNewColumns: PropTypes.func.isRequired,
  schema: PropTypes.object.isRequired,
  detail: PropTypes.string,
  allColumns: PropTypes.array,
};

GraphComponent.defaultProps = {
  handleClick: null,
  classes: null,
  detail: null,
  allColumns: [],
};

export default withStyles(styles)(GraphComponent);
