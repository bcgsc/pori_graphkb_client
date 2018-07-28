import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './GraphComponent.css';
import * as d3 from 'd3';
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
  TextField,
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
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import ViewListIcon from '@material-ui/icons/ViewList';
import BuildIcon from '@material-ui/icons/Build';
import RefreshIcon from '@material-ui/icons/Refresh';
import { withStyles } from '@material-ui/core/styles';
import SVGLink from '../SVGLink/SVGLink';
import SVGNode from '../SVGNode/SVGNode';
import util from '../../services/util';
import config from '../../config.json';

const {
  ARROW_WIDTH,
  ARROW_LENGTH,
  NODE_INIT_RADIUS,
  NODE_RADIUS,
  DETAILS_RING_RADIUS,
} = config.GRAPH_PROPERTIES;

const {
  LINK_STRENGTH,
  CHARGE_STRENGTH,
  DEFAULT_NODE_COLOR,
} = config.GRAPH_DEFAULTS;

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

    const actionsRing = [];
    const options = [
      {
        name: 'Details',
        icon: <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />,
      },
      {
        name: 'Close',
        icon: <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />,
      },
      {
        name: 'Expand',
        icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />,
      },
      {
        name: 'Hide',
        icon: <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />,
      },
    ];
    options.forEach((option, i) => {
      const l = options.length;
      const start = {
        x: DETAILS_RING_RADIUS * Math.cos((i + 1) / l * 2 * Math.PI),
        y: DETAILS_RING_RADIUS * Math.sin((i + 1) / l * 2 * Math.PI),
      };
      const end = {
        x: DETAILS_RING_RADIUS * Math.cos(i / l * 2 * Math.PI),
        y: DETAILS_RING_RADIUS * Math.sin(i / l * 2 * Math.PI),
      };

      const d = [
        'M', start.x, start.y,
        'A', DETAILS_RING_RADIUS, DETAILS_RING_RADIUS, 0, 0, 0, end.x, end.y,
        'L', 0, 0,
        'L', start.x, start.y,
      ].join(' ');

      const angle = (2 * i + 1) / l * Math.PI;
      const dx = DETAILS_RING_RADIUS * Math.cos(angle);
      const dy = DETAILS_RING_RADIUS * Math.sin(angle);
      const iconDims = 24;
      const scale = 0.8;
      actionsRing.push((
        <g
          style={{ cursor: 'pointer' }}
          onClick={() => this.handleActionsRing(i)}
          key={d}
        >
          <path
            d={d}
            fill="rgba(255,255,255,0.8)"
            stroke="#ccc"
          />
          <g
            transform={`translate(${dx * 0.64 - iconDims * scale / 2}, ${dy * 0.64 - iconDims * scale / 2}) scale(${scale})`}
            fill="#555"
          >
            {(option || '').icon}
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={7}
              dy={iconDims + 4}
              dx={iconDims / 2}
            >
              {`(${option.name})`}
            </text>
          </g>
        </g>
      ));
    });

    this.state = {
      nodes: [],
      links: [],
      graphObjects: {},
      expandedEdgeTypes: [],
      simulation: null,
      svg: undefined,
      graphOptions: {
        width: 0,
        height: 0,
        defaultColor: DEFAULT_NODE_COLOR,
        linkStrength: LINK_STRENGTH,
        chargeStrength: CHARGE_STRENGTH,
        collisionRadius: NODE_RADIUS,
        autoCollisionRadius: false,
        linkHighlighting: true,
        nodeLabelProp: 'name',
        linkLabelProp: '@class',
        nodesColor: '@class',
        linksColor: '',
        legend: false,
        nodesColors: {},
        linksColors: {},
      },
      graphOptionsPanel: false,
      expandable: {},
      actionsRing,
      actionsNode: null,
      expansions: [],
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
    this.handleLegendSectionToggle = this.handleLegendSectionToggle.bind(this);
    this.handleGraphColorsChange = this.handleGraphColorsChange.bind(this);
  }

  /**
   * Loads edge types, initializes graph and populates it with specified input nodes.
   * Initializes event listener for window resize.
   */
  async componentDidMount() {
    const {
      displayed,
      data,
      edgeTypes,
      ontologyTypes,
    } = this.props;
    const { graphOptions } = this.state;
    const simulation = d3.forceSimulation();

    // Defines what edge keys to look for.
    const expandedEdgeTypes = edgeTypes.reduce((r, e) => {
      r.push(`in_${e}`);
      r.push(`out_${e}`);
      return r;
    }, []);

    ontologyTypes.forEach((type, i) => {
      graphOptions[`${type.name}Color`] = util.chooseColor(i, ontologyTypes.length);
    });

    let validDisplayed = displayed;
    if (!validDisplayed || validDisplayed.length === 0) {
      validDisplayed = [Object.keys(data)[0]];
    }
    this.setState({
      expandedEdgeTypes,
      ontologyTypes,
      graphOptions,
      simulation,
    }, () => {
      this.handleResize();
      validDisplayed.forEach((key, i) => {
        this.setState(
          {
            ...this.processData(
              data[key],
              GraphComponent.positionInit(0, 0, i, validDisplayed.length),
              0,
            ),
          },
        );
      });

      this.drawGraph();
      this.setState({ expandId: validDisplayed[0] });
      window.addEventListener('resize', this.handleResize);
      this.updateColors('nodes');
      this.updateColors('links');
    });
  }

  /**
   * Removes all event listeners.
   */
  componentWillUnmount() {
    const { svg, simulation } = this.state;
    // remove all event listeners
    svg.call(d3.zoom()
      .on('zoom', null))
      .on('dblclick.zoom', null);
    simulation.on('tick', null);
    window.removeEventListener('resize', this.handleResize);
  }

  /**
   * Calls the api and renders neighbor nodes of the input node onto the graph.
   * @param {Object} node - d3 simulation node whose neighbors were requestsed.
   */
  loadNeighbors(node) {
    const {
      expandable,

    } = this.state;
    const { data } = this.props;

    if (expandable[node.data['@rid']] && data[node.data['@rid']]) {
      this.setState({
        ...this.processData(
          data[node.data['@rid']],
          { x: node.x, y: node.y },
          1,
        ),
      });
      this.drawGraph();
      this.updateColors('nodes');
      this.updateColors('links');
    }

    delete expandable[node.data['@rid']];
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
    } = this.state;
    const { data } = this.props;
    /* eslint-disable */
    if (data[node['@rid']]) node = data[node['@rid']];
    /* eslint-enable */
    if (!graphObjects[node['@rid']]) {
      nodes.push({
        data: node,
        x: position.x,
        y: position.y,
      });
      graphObjects[node['@rid']] = node;
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

              // Checks if node is already rendered
              if (outRid && !graphObjects[outRid]) {
                // Initializes position of new child
                const positionInit = GraphComponent.positionInit(
                  position.x,
                  position.y,
                  j += 1,
                  n,
                );
                const d = this.processData(
                  edge.out,
                  positionInit,
                  depth - 1,
                );
                this.setState({ nodes: d.nodes, links: d.links, graphObjects: d.graphObjects });
              }
              if (inRid && !graphObjects[inRid]) {
                const positionInit = GraphComponent.positionInit(
                  position.x,
                  position.y,
                  j += 1,
                  n,
                );
                const d = this.processData(
                  edge.in,
                  positionInit,
                  graphObjects,
                  depth - 1,
                );
                this.setState({ nodes: d.nodes, links: d.links, graphObjects: d.graphObjects });
              }

              // Updates expanded on target node.
              if (expandable[targetRid]) {
                let targetFlag = false;
                expandedEdgeTypes.forEach((e) => {
                  if (graphObjects[targetRid][e]) {
                    graphObjects[targetRid][e].forEach((l) => {
                      if (
                        !graphObjects[l['@rid'] || l]
                        && !((l.in || {})['@class'] === 'Statement' || (l.out || {})['@class'] === 'Statement')
                      ) {
                        targetFlag = true;
                      }
                    });
                  }
                });
                expandable[targetRid] = targetFlag;
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
    /* eslint-disable */
    const objs = this.state[type];
    const { graphOptions } = this.state;
    const key = graphOptions[`${type}Color`];
    const colors = {};
    objs.forEach((obj) => {
      if (key.includes('.')) {
        const keys = key.split('.');
        if (obj.data[keys[0]][keys[1]] && !colors[obj.data[keys[0]][keys[1]]]) {
          colors[obj.data[keys[0]][keys[1]]] = '';
        }
      }
      if (obj.data[key] && !colors[obj.data[key]]) {
        colors[obj.data[key]] = '';
      }
    });
    const pallette = util.getPallette(Object.keys(colors).length);
    Object.keys(colors).forEach((color, i) => { colors[color] = pallette[i + 1]; });

    graphOptions[`${type}Colors`] = colors;
    graphOptions[`${type}Pallette`] = pallette;
    this.setState({ graphOptions });
    /* eslint-enable */
  }

  /**
   * Updates node colors or retrieves node neighbors.
   * @param {Event} e - User click event.
   * @param {Object} node - Clicked simulation node.
   */
  async handleClick(e, node) {
    const { handleClick, handleDetailDrawerOpen } = this.props;
    const { expandId } = this.state;

    await handleClick(node.data['@rid'], node.data['@class']);

    if (node.data['@rid'] === expandId) {
      this.setState({ actionsNode: node });
    } else {
      handleDetailDrawerOpen(node);
      this.setState({ expandId: node.data['@rid'] });
    }
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

  handleGraphColorsChange(e, type) {
    const { graphOptions } = this.state;
    graphOptions[`${type}Color`] = e.target.value;
    this.setState({ graphOptions }, () => this.updateColors(type));
  }

  /**
   * Handles user selections within the actions ring.
   * @param {number} section - number of section of actions ring clicked.
   */
  handleActionsRing(section) {
    const { actionsNode } = this.state;
    const { handleDetailDrawerOpen } = this.props;
    const options = [
      () => handleDetailDrawerOpen(actionsNode, true),
      () => this.setState({ actionsNode: null }),
      () => this.loadNeighbors(actionsNode),
      this.handleNodeHide,
    ];
    options[section]();
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

    this.setState({
      expandable,
      nodes,
      links,
      graphObjects,
      actionsNode: null,
      expandId: null,
    }, () => {
      this.updateColors('nodes');
      this.updateColors('links');
      handleDetailDrawerClose();
    });
  }

  handleLegendSectionToggle(key) {
    const { expansions } = this.state;
    if (expansions.includes(key)) {
      const newList = expansions.filter(n => !n.startsWith(key));
      this.setState({ expansions: newList });
    } else {
      expansions.push(key);
      this.setState({ expansions });
    }
  }

  render() {
    const {
      nodes,
      links,
      actionsNode,
      expandable,
      graphOptions,
      simulation,
      graphOptionsPanel,
      actionsRing,
    } = this.state;

    const {
      classes,
      handleTableRedirect,
      detail,
      handleDetailDrawerClose,
    } = this.props;

    if (!simulation) return null;

    const endArrowSize = {
      d: `M0,0,L0,${ARROW_WIDTH} L ${ARROW_LENGTH}, ${ARROW_WIDTH / 2} z`,
      refX: NODE_RADIUS - 1,
      refY: ARROW_WIDTH / 2,
    };

    const optionsPanel = (
      <Dialog
        open={graphOptionsPanel}
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
        <DialogTitle>
          Graph Options
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
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="sourceId">Source ID</MenuItem>
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
                <MenuItem value="">No Coloring</MenuItem>
                <MenuItem value="@class">Class</MenuItem>
                <MenuItem value="source.name">Source</MenuItem>
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
                <MenuItem value="source.name">Source</MenuItem>
              </Select>
            </FormControl>
            <FormControl className="graph-option">
              <InputLabel htmlFor="linksColor">Color edges by</InputLabel>
              <Select
                input={<Input name="linksColor" id="linksColor" />}
                onChange={e => this.handleGraphColorsChange(e, 'links')}
                value={graphOptions.linksColor}
              >
                <MenuItem value="">No Coloring</MenuItem>
                <MenuItem value="@class">Class</MenuItem>
              </Select>
              <Divider />
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
                    name="legend"
                    checked={graphOptions.legend && graphOptions.nodesColor}
                  />
                )}
                label="Show Coloring Legend"
              />
            </FormControl>
          </div>
          <Divider />
          <div className="advanced-options-wrapper">
            <Typography variant="title">
              Advanced Graph Options
            </Typography>
            <div className="advanced-options-grid">
              <div className="graph-input-wrapper">
                <TextField
                  label="Link Strength"
                  name="linkStrength"
                  type="number"
                  value={graphOptions.linkStrength}
                  onChange={this.handleGraphOptionsChange}
                  step={0.001}
                />
              </div>
              <div className="graph-input-wrapper">
                <TextField
                  label="Charge Strength"
                  name="chargeStrength"
                  type="number"
                  value={graphOptions.chargeStrength}
                  onChange={this.handleGraphOptionsChange}
                />
              </div>
              <div className="graph-input-wrapper">
                <TextField
                  label="Collision Radius"
                  name="collisionRadius"
                  type="number"
                  value={graphOptions.collisionRadius}
                  onChange={this.handleGraphOptionsChange}
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
      <Paper className="legend-wrapper">
        <div className="close-btn">
          <IconButton
            name="legend"
            onClick={() => this.handleGraphOptionsChange({
              target: {
                value: false,
                name: 'legend',
              },
            })}
          >
            <CloseIcon />
          </IconButton>
        </div>
        <div className="legend-content">
          <Typography variant="subheading">Nodes</Typography>
          <Typography variant="caption">
            {graphOptions.nodesColor ? `(${graphOptions.nodesColor.split('.')[0]})` : ''}
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
          </List>
        </div>
      </Paper>
    );

    const linksDisplay = links.map(link => (
      <SVGLink
        key={link.data['@rid']}
        link={link}
        linkHighlighting={graphOptions.linkHighlighting}
        detail={detail}
        labelKey={graphOptions.linkLabelProp}
      />
    ));

    const nodesDisplay = nodes.map((node) => {
      let nodeColorKey = '';
      if (graphOptions.nodesColor && graphOptions.nodesColor.includes('.')) {
        const keys = graphOptions.nodesColor.split('.');
        nodeColorKey = node.data[keys[0]][keys[1]];
      } else if (graphOptions.nodesColor) {
        nodeColorKey = node.data[graphOptions.nodesColor];
      }
      const color = graphOptions.nodesColors[nodeColorKey];

      const isExpandable = expandable[node.data['@rid']];
      return (
        <SVGNode
          key={`node${node.data['@rid']}`}
          node={node}
          simulation={simulation}
          color={color}
          r={NODE_RADIUS}
          handleClick={e => this.handleClick(e, node)}
          expandable={isExpandable}
          actionsRing={actionsNode === node ? actionsRing : null}
          label={graphOptions.nodeLabelProp}
          detail={detail}
        />
      );
    });

    return (
      <div className="graph-wrapper">
        {optionsPanel}
        <Popper open={!!(graphOptions.legend && graphOptions.nodesColor)}>
          {legend}
        </Popper>
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
                refX={endArrowSize.refX}
                refY={endArrowSize.refY}
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d={endArrowSize.d} fill="#555" />
              </marker>
              <marker
                id="highLightedArrow"
                markerWidth={ARROW_LENGTH}
                markerHeight={ARROW_WIDTH}
                refX={endArrowSize.refX}
                refY={endArrowSize.refY}
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d={endArrowSize.d} className="highlighted-arrow" />
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
  */
GraphComponent.propTypes = {
  handleClick: PropTypes.func,
  data: PropTypes.object.isRequired,
  classes: PropTypes.object,
  handleDetailDrawerOpen: PropTypes.func.isRequired,
  handleDetailDrawerClose: PropTypes.func.isRequired,
  handleTableRedirect: PropTypes.func.isRequired,
  edgeTypes: PropTypes.array.isRequired,
  ontologyTypes: PropTypes.array.isRequired,
  detail: PropTypes.string,
};

GraphComponent.defaultProps = {
  handleClick: null,
  classes: null,
  detail: null,
};


export default withStyles(styles)(GraphComponent);
