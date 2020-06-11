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
import * as d3Force from 'd3-force';
import * as d3Select from 'd3-selection';
import * as d3Zoom from 'd3-zoom';
import isObject from 'lodash.isobject';
import PropTypes from 'prop-types';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';

import useObject from '@/components/hooks/useObject';
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

const initialGraphData = {
  actionsNode: null,
  simulation: d3Force.forceSimulation(),
  svg: undefined,
  graphOptions: new GraphOptions(),
  graphOptionsOpen: false,
  expansionDialogOpen: false,
  expandNode: null,
  expandExclusions: [],
  allProps: ['@rid, @class'],
  nodes: [],
  links: [],
  expandable: {},
  data: {},
  graphObjects: {},
};

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
function GraphComponent(props) {
  const snackbar = useContext(SnackbarContext);
  const {
    data: initialData,
    getRecord,
    handleError,
    handleDetailDrawerOpen,
    handleGraphStateSave,
    edgeTypes,
    handleDetailDrawerClose,
    detail,
  } = props;

  const {
    content: graphValues,
    update,
  } = useObject(initialGraphData);

  const {
    actionsNode,
    simulation,
    svg,
    graphOptions,
    graphOptionsOpen,
    expansionDialogOpen,
    expandNode,
    expandExclusions,
    allProps,
    data,
  } = graphValues;

  let {
    nodes,
    links,
    graphObjects,
    expandable,
  } = graphValues;

  const propsMap = useRef(new PropsMap());
  const graph = useRef(null);
  const zoom = useRef(null);
  const wrapper = useRef(null);

  const getGraphOptions = () => {
    const newGraphOptions = new GraphOptions();
    const storedOptions = GraphOptions.retrieve();
    let initialGraphOptions;

    if (storedOptions) {
      initialGraphOptions = storedOptions;
    } else {
      const nodePropVal = Object.values(propsMap.current.nodeProps);
      const nodeHasDefaultProps = nodePropVal.length !== 0;

      if (nodeHasDefaultProps) {
        newGraphOptions.nodesLegend = true;
      }
      initialGraphOptions = newGraphOptions;
    }

    return initialGraphOptions;
  };

  /**
   * Saves graph state into URL. Only graph nodes are saved to maximize
   * number of nodes that can be shared. Also reheats simulation and changes
   * node coloring to avoid sending full graph state over limited URL.
   */
  const saveGraphStatetoURL = useCallback((graphNodes) => {
    const withoutStatementData = [];

    /* Because properties types like linkset are uni-directional, we need to
    have nodes that are connected via a linkset property rendered first.
    For example, if a statement class node has a link property 'conditions' which
    points to node A, node A will not have an equivalent 'implies' property
    to map it back to the statement node */

    graphNodes.forEach((node) => {
      if (node.data['@class'] !== 'Statement') {
        withoutStatementData.push(node.data['@rid']);
      }
    });

    const nodeRIDs = [...withoutStatementData];
    graphNodes.forEach((node) => {
      if (node.data['@class'] === 'Statement') {
        nodeRIDs.push(node.data['@rid']);
      }
    });

    try {
      handleGraphStateSave(nodeRIDs);
    } catch (err) {
      handleError(err);
    }
  });

  /**
   * Initializes simulation rules and properties. Updates simulation component state.
   */
  const initSimulation = (sim, graphOpt) => {
    sim.force(
      'link',
      d3Force.forceLink().id(d => d.getId()),
    ).force(
      'collide',
      d3Force.forceCollide(graphOpt.collisionRadius),
    ).force(
      'charge',
      d3Force.forceManyBody()
        .strength(-graphOpt.chargeStrength)
        .distanceMax(graphOpt.chargeMax),
    );

    const container = d3Select.select(zoom.current);
    const SVG = d3Select.select(graph.current);

    SVG
      .attr('width', wrapper.current.clientWidth)
      .attr('height', wrapper.current.clientHeight)
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

    update({ simulation: sim, svg: SVG });
  };

  const updateColumnProps = useCallback((node) => {
    const nodeProps = Object.keys(node);
    nodeProps.forEach((prop) => { allProps.push(prop); });
    const updatedAllProps = [...new Set(allProps)];
    update({ allProps: updatedAllProps });
  }, [allProps, update]);


  /**
   * Adds a graphNode or graphLink to graphObjects.
   * @param {string} type one of ['link', 'node']
   * @param {object} data record information
   * @param {object} prop1 either x position if graphNode or source if graphLink
   * @param {object} prop2 either y position if graphNode or target if graphLink
   * @param {object} graphObjects graphObjects attached to simulation
   * @param {object} pMap propsMap keeps track of node/link properties and associated values
   */
  const addGraphObject = useCallback((type, graphData, prop1, prop2, graphObjs, pMap) => {
    const newGraphObject = type === 'node'
      ? new GraphNode(graphData, prop1, prop2)
      : new GraphLink(graphData, prop1, prop2);

    let objs;

    if (type === 'node') {
      objs = nodes;
    } else {
      objs = links;
    }

    objs.push(newGraphObject);
    graphObjs[graphData['@rid']] = graphData;

    if (type === 'node') {
      pMap.loadNode(graphData, allProps);
    } else {
      pMap.loadLink(graphData);
    }
  }, [allProps, links, nodes]);


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
  const processData = useCallback((node, pos, expansionFlag, prevstate, exclusions = []) => {
    let {
      nodes, // eslint-disable-line no-shadow
      links, // eslint-disable-line no-shadow
      graphObjects, // eslint-disable-line no-shadow
      expandable, // eslint-disable-line no-shadow
    } = prevstate;

    if (data[node['@rid']]) {
      node = data[node['@rid']]; // eslint-disable-line no-param-reassign
    } else {
      // Node properties haven't been processed.
      updateColumnProps(node);
    }

    if (!graphObjects[node['@rid']]) {
      addGraphObject('node', node, pos.x, pos.y, graphObjects, propsMap.current);
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
              addGraphObject('link', edge, outRid, inRid, graphObjects, propsMap.current);

              // Checks if node is already rendered
              if (outRid && !graphObjects[outRid]) {
                // Initializes position of new child
                const positionInit = util.positionInit(pos.x, pos.y, index, n);
                ({
                  nodes,
                  links,
                  expandable,
                  graphObjects,
                } = processData(
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
                } = processData(
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
              addGraphObject('link', graphLinkData, sourceRid, targetRid, graphObjects, propsMap.current);

              // check if node is already rendered
              if (targetRid && !graphObjects[targetRid]) {
                // Initializes position of new child
                const positionInit = util.positionInit(pos.x, pos.y, index, n);
                ({
                  nodes,
                  links,
                  expandable,
                  graphObjects,
                } = processData(
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
  }, [addGraphObject, data, edgeTypes, updateColumnProps]);

  /**
   * Renders nodes and links to the graph.
   */
  const drawGraph = useCallback((gNodes, gLinks, sim, graphOpts) => {
    // set up the hierarchy
    sim.nodes(gNodes);

    if (graphOptions.isTreeLayout) {
      const ranks = computeNodeLevels(links);
      const partitions = Math.max(...[0, ...Object.values(ranks)]) + 2;
      const partitionSize = wrapper.current.clientHeight / partitions;
      // partial force https://stackoverflow.com/questions/39575319/partial-forces-on-nodes-in-d3-js
      const subclassYForce = d3Force.forceY(node => (partitions - ranks[getId(node)] - 1) * partitionSize);
      const init = subclassYForce.initialize;

      subclassYForce.initialize = (allNodes) => {
        init(allNodes.filter(node => ranks[getId(node)] !== undefined));
      };

      sim.force('y', subclassYForce);
    }

    sim.force(
      'links',
      d3Force
        .forceLink(gLinks)
        .strength((link) => {
          if ((link.data['@class'] !== TREE_LINK) && graphOpts.isTreeLayout) {
            return 5 * graphOpts.linkStrength;
          }
          return graphOpts.linkStrength;
        }).id(d => d.getId()),
    );

    const ticked = () => {
      const shiftDistance = 1 * sim.alpha();
      gLinks.forEach((link) => {
        if (link.data['@class'] === TREE_LINK && graphOpts.isTreeLayout) {
          link.source.y += shiftDistance;
          link.target.y -= shiftDistance;
        }
      });

      // This is where all the updates occur to nodes/links so that React can
      // render the svgs correctly.
      const newLinks = [...gLinks];
      const newNodes = [...gNodes];

      update({ nodes: newNodes, links: newLinks });
    };

    sim.on('tick', ticked);
    sim.restart();
    update({ simulation: sim, actionsNode: null });
  }, [graphOptions.isTreeLayout, links, update]);

  /**
   * Given key and all unique node/link props, checks to see if key selected
   * is a valid or bad choice for node/link coloring. Also returns whether or not
   * there are too many unique colors for given key.
   */
  const coloringKeyCheck = (pMap, colorPalette = {}, key, type) => {
    const properties = pMap[`${type}Props`];
    const tooManyUniques = (Object.keys(colorPalette).length > PALLETE_SIZE
      && Object.keys(properties).length !== 1);
    const noUniques = properties[key]
      && (properties[key].length === 0
        || (properties[key].length === 1 && properties[key].includes('null')));
    const notDefined = key && !properties[key];

    const isColoringKeyBad = (tooManyUniques || noUniques || notDefined);
    return [isColoringKeyBad, tooManyUniques];
  };

  /**
   * Handles user selections within the actions ring.
   * @param {function} action - callback function to be called before node is
   * deselected.
   */
  const withClose = (action = null) => {
    if (action) {
      action();
    }
    update({ actionsNode: null });
  };


  /**
   * updates color mapping based on data properties of graphobject and selected
   * coloring key.
   *
   * @param {object} colorPalette maps properties to colors from palette
   * @param {object} graphObjectData data from graph object
   * @param {string} key selected coloring key ex. 'class', 'rid', 'name'
   */
  const updateColorPalette = (colorPalette, graphObjectData, key) => {
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
   * Updates color scheme for the graph, for nodes or links via graphOptions.
   */
  const updateColors = useCallback((gNodes, gLinks, graphOpts) => {
    ['node', 'link'].forEach((type) => {
      const objs = type === 'node' ? gNodes : gLinks;
      const key = graphOpts[`${type}sColor`];

      let colors = {};
      objs.forEach((obj) => {
        colors = updateColorPalette(colors, obj.data, key);
      });
      const [isColoringKeyBad, tooManyUniques] = coloringKeyCheck(propsMap.current, colors, key, type);

      if (isColoringKeyBad) {
        if (tooManyUniques) {
          snackbar.add(`${GRAPH_UNIQUE_LIMIT} (${graphOpts[`${type}sColor`]})`);
        }
        graphOpts[`${type}sColor`] = ''; // reset coloring prop chosen
        updateColors(gNodes, gLinks, graphOpts);
      } else {
        const pallette = util.getPallette(Object.keys(colors).length, `${type}s`);
        Object.keys(colors).forEach((prop, i) => { colors[prop] = pallette[i]; });

        graphOpts[`${type}sColors`] = colors;
        graphOpts[`${type}sPallette`] = pallette;

        update({ graphOptions: graphOpts });
      }
    });
  }, [snackbar, update]);

  /**
   * Refreshes the layout simulation with the current nodes
   *
   * @property {object} seed seed graph Info to refresh view
   * @property {d3} simulation d3 force layout
   * @property {graphOptions} graphOptions graphOptions object
   * @property {Arrayof<GraphObjects>} nodes list of node graphObjects
   * @property {Arrayof<GraphObjects>} links list of link graphObjects
   */
  const refresh = useCallback((seed = null) => {
    let sim = simulation;
    let gNodes = nodes;
    let gLinks = links;
    let graphOpts = graphOptions;

    if (seed) {
      const {
        simulation: seedSim,
        nodes: seedNodes,
        links: seedLinks,
        graphOptions: seedGraphOptions,
      } = seed;
      sim = seedSim;
      gNodes = seedNodes;
      gLinks = seedLinks;
      graphOpts = seedGraphOptions;
    }

    updateColors(gNodes, gLinks, graphOpts);
    drawGraph(gNodes, gLinks, sim, graphOpts);
    sim.alpha(1).restart();
    handleDetailDrawerClose();
  }, [drawGraph, graphOptions, handleDetailDrawerClose, links, nodes, simulation, updateColors]);

  /**
   * Resizes svg window and reinitializes the simulation.
   */
  const handleResize = () => {
    if (wrapper.current) {
      initSimulation(simulation, graphOptions);
    }
  };

  /**
   * Loads edge types, initializes graph and populates it with specified input nodes.
   * Initializes event listener for window resize.
   */
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    const nodeRIDs = Object.keys(initialData);
    nodeRIDs.forEach((rid, index) => {
      ({
        nodes,
        links,
        graphObjects,
        expandable,
        // eslint-disable-next-line react-hooks/exhaustive-deps
      } = processData(
        initialData[rid],
        util.positionInit(wrapper.current.clientWidth / 2, wrapper.current.clientHeight / 2, index, nodeRIDs.length),
        false,
        {
          nodes,
          links,
          graphObjects,
          expandable,
        },
      ));
    });

    const intialGraphOptions = getGraphOptions(propsMap.current);
    initSimulation(simulation, intialGraphOptions);

    const initialSeed = {
      simulation, graphOptions: intialGraphOptions, nodes, links,
    };

    refresh(initialSeed);

    update({
      nodes, links, graphObjects, expandable, data: initialData,
    });

    return () => {
      if (svg) {
        svg.call(d3Zoom.zoom()
          .on('zoom', null))
          .on('dblclick.zoom', null);
      }
      simulation.on('tick', null);
      window.removeEventListener('resize', handleResize);
      graphOptions.load();
    };
  }, []);

  /**
   * Applies drag behavior to node.
   * @param {GraphNode} node - node to be dragged.
   */
  const applyDrag = (node) => {
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
  };

  /**
   * Checks if node is fully expanded. Looks at all edge properties on record to see
   * if there are any edges not rendered as a link object already.
   *
   * @param {object} record record data. Node data returned from api
   */
  const isFullyExpanded = record => !schema.getEdges(record).some(edge => !links.find(l => l.getId() === edge['@rid']));

  /**
   * Calls the api and renders neighbor nodes of the input node onto the graph.
   * @param {GraphNode} node - d3 simulation node whose neighbors were requested.
   */
  const loadNeighbors = (node) => {
    if (expandable[node.getId()] && data[node.getId()]) {
      ({
        nodes,
        links,
        graphObjects,
        expandable,
      } = processData(
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

    refresh({
      simulation, graphOptions, nodes, links,
    });
    saveGraphStatetoURL([...nodes]);

    if (isFullyExpanded(data[node.getId()])) {
      delete expandable[node.getId()];
    }

    update({
      nodes, links, graphObjects, expandable, actionsNode: null, expandExclusions: [],
    });
  };

  /**
   * Pauses d3 force simulation by making simulation 'tick' event handler a
   * noop.
   */
  const pauseGraph = useCallback(() => {
    simulation.on('tick', null);
  });

  /**
   * Determines whether to quickly selected load node neighbors or open the
   * expansion dialog panel.
   * @param {GraphNode} node - d3 simulation node to be expanded.
   */
  const handleExpandRequest = (node) => {
    const nodeIsHeavilyConnected = (currNode) => {
      const nodeEdges = schema.getEdges(currNode);
      const edgesToBeRendered = nodeEdges.filter(edge => !(links.find(l => l.getId() === edge['@rid'])));
      return (edgesToBeRendered.length > HEAVILY_CONNECTED);
    };

    if (expandable[node.getId()] && data[node.getId()]) {
      if (nodeIsHeavilyConnected(data[node.getId()])
      ) {
        // Opens up expansion confirmation dialog
        update({ expandNode: data[node.getId()], expansionDialogOpen: true });
        pauseGraph();
      } else {
        loadNeighbors(node);
      }
    }
  };

  const handleExpandNode = useCallback(async ({ data: node }) => {
    try {
      const record = await getRecord(node['@rid']);

      if (data[record['@rid']] === undefined) {
        data[record['@rid']] = record;
        update({ data });
      }
    } catch (err) {
      console.error(err);
      handleError(err);
    }
  }, [data, getRecord, handleError, update]);

  /**
   * Handles node clicks from user. If node is unspecified, graph is refreshed.
   * @param {Object} node - Clicked simulation node.
   */
  const handleClick = useCallback(async (node) => {
    if (node) {
      // Prematurely loads neighbor data.
      await handleExpandNode(node);

      // Update contents of detail drawer if open.
      handleDetailDrawerOpen(node);
      // Sets clicked object as actions node.
      update({ actionsNode: node });

      pauseGraph();
    } else {
      refresh();
    }
  }, [handleDetailDrawerOpen, handleExpandNode, pauseGraph, refresh, update]);

  /**
   * Updates graph options, re-initializes simulation, and re-renders objects.
   * @param {Event} event - User input event.
   * @param {boolean} isAdvanced - Advanced option flag.
   */
  const handleGraphOptionsChange = (event) => {
    const { target: { name, value } } = event;
    graphOptions[name] = value;
    graphOptions.load();
    refresh({
      simulation, graphOptions, nodes, links,
    });
  };

  /**
   * Closes additional help dialog.
   * @property {string} key is one of ['expansionDialogOpen', 'graphOptionsOpen']
   */
  const handleDialogClose = (key) => {
    if (key === 'expansionDialogOpen') {
      update({ expansionDialogOpen: false });
    } else {
      update({ graphOptionsOpen: false });
    }
    drawGraph(nodes, links, simulation, graphOptions);
    setTimeout(() => update({ expandExclusions: [] }), DIALOG_FADEOUT_TIME);
  };

  /**
   * Opens graphOptions help dialog.
   */
  const openGraphOptions = () => {
    update({ graphOptionsOpen: true });
    pauseGraph();
  };

  /**
   * Expands currently staged nodes. Passed to GraphExpansion Dialog to expand nodes.
   */
  const handleExpand = () => {
    update({ expansionDialogOpen: false });
    setTimeout(() => loadNeighbors(actionsNode), DIALOG_FADEOUT_TIME);
  };

  /**
   * Handles link clicks from user.
   * @param {Object} link - Clicked simulation link.
   */
  const handleLinkClick = useCallback((link) => {
    // Update contents of detail drawer if open.
    handleDetailDrawerOpen(link, false, true);

    // Sets clicked object as actions node.
    update({ actionsNode: link });
  }, [handleDetailDrawerOpen, update]);

  /**
   * Hides link from the graph view.
   */
  const handleLinkHide = useCallback(() => {
    const i = links.indexOf(actionsNode);
    links.splice(i, 1);
    delete graphObjects[actionsNode.data['@rid']];

    expandable[actionsNode.source.data['@rid']] = true;
    expandable[actionsNode.target.data['@rid']] = true;

    updateColors(nodes, links, graphOptions);
    handleDetailDrawerClose();

    update({
      links, graphObjects, expandable, actionsNode: null,
    });
  }, [actionsNode, expandable, graphObjects, graphOptions, handleDetailDrawerClose, links, nodes, update, updateColors]);

  /**
   * Removes node and all corresponding edges/links from the graph.
   */
  const handleNodeHide = useCallback(() => {
    if (nodes.length === 1) return;
    const i = nodes.indexOf(actionsNode);

    nodes.splice(i, 1);
    delete graphObjects[actionsNode.data['@rid']];

    // deletes edges
    edgeTypes.forEach((edgeType) => {
      const { data: record } = actionsNode;

      if (record[edgeType] && record[edgeType].length !== 0) {
        record[edgeType].forEach((edge) => {
          const edgeRid = edge['@rid'] || edge;
          const j = links.findIndex(l => l.data['@rid'] === edgeRid);

          if (j !== -1) {
            const link = links[j];
            const targetRid = link.source.data['@rid'] === record['@rid']
              ? link.target.data['@rid'] : link.source.data['@rid'];
            links.splice(j, 1);
            propsMap.current.removeLink(link.data, links);
            delete graphObjects[edgeRid];
            expandable[targetRid] = true;
          }
        });
      }
    });

    // delete links
    const updatedLinks = [...links];
    let indexAdjustment = 0; // increase this with every link deletion
    links.forEach((link, index) => {
      const { data: { in: sourceRID, out: targetRID, '@rid': edgeRID } } = link;
      const { data: { '@rid': nodeRID } } = actionsNode;

      if (sourceRID === nodeRID || targetRID === nodeRID) {
        updatedLinks.splice(index - indexAdjustment, 1);
        indexAdjustment += 1;
        propsMap.current.removeLink(link.data, links);
        delete graphObjects[edgeRID];

        if (sourceRID === nodeRID) {
          expandable[targetRID] = true;
        } else {
          expandable[sourceRID] = true;
        }
      }
    });

    propsMap.current.removeNode(actionsNode.data, nodes, allProps);
    saveGraphStatetoURL(nodes);
    updateColors(nodes, links, graphOptions);
    handleDetailDrawerClose();

    update({
      nodes, links: updatedLinks, expandable, graphObjects, actionsNode: null,
    });
  }, [actionsNode, allProps, edgeTypes, expandable, graphObjects, graphOptions, handleDetailDrawerClose, links, nodes, saveGraphStatetoURL, update, updateColors]);

  /**
   * Toggles a specified edge ID from the exclusions list.
   * @param {string} rid - edge ID to be pushed/popped from the expand
   * exclusions list.
   */
  const handleExpandExclusion = (rid) => {
    const i = expandExclusions.indexOf(rid);

    if (i === -1) {
      expandExclusions.push(rid);
    } else {
      expandExclusions.splice(i, 1);
    }
    update({ expandExclusions });
  };

  /**
   * Selects/Deselects all options in the expand node dialog.
   */
  const handleExpandCheckAll = () => {
    const allEdges = schema.getEdges(expandNode).map(e => e['@rid']);
    let newExpandExclusions = [];

    if (expandExclusions.length !== allEdges.length) {
      newExpandExclusions = allEdges;
    }
    update({ expandExclusions: newExpandExclusions });
  };

  /**
   * Expands all links of specified class on the expand node.
   * @param {string} cls - KB edge class name to be expanded.
   */
  const handleExpandByClass = cls => () => {
    const updatedExpandExclusions = [];
    schema.getEdges(expandNode).forEach((edge) => {
      if (edge['@class'] !== cls) {
        updatedExpandExclusions.push(edge['@rid']);
      }
    });
    update({ expandExclusions: updatedExpandExclusions });
  };

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
        action: () => withClose(() => handleDetailDrawerOpen(actionsNode, true, true)),
        disabled: link => link.getId() === (detail || {})['@rid'],
      },
      {
        name: 'Hide',
        action: () => withClose(handleLinkHide),
        disabled: false,
      }]
    : [
      {
        name: 'Details',
        action: () => withClose(() => handleDetailDrawerOpen(actionsNode, true)),
        disabled: node => node.getId() === (detail || {})['@rid'],
      },
      {
        name: 'Close',
        action: () => withClose(),
      },
      {
        name: 'Expand',
        action: () => handleExpandRequest(actionsNode),
        disabled: node => !expandable[node.getId()],
      },
      {
        name: 'Hide',
        action: () => withClose(handleNodeHide),
        disabled: () => nodes.length === 1,
      },
    ];

  const actionsRing = (
    <GraphActionsNode
      actionsNode={actionsNode}
      edge={actionsNodeIsEdge}
      options={actionsRingOptions}
    />
  );

  const linksDisplay = links.map(link => (
    <GraphLinkDisplay
      key={link.getId()}
      actionsNode={actionsNode}
      color={graphOptions.getColor(link, 'links')}
      detail={detail}
      handleClick={() => handleLinkClick(link)}
      labelKey={graphOptions.linkLabelProp}
      link={link}
      marker={`url(#${MARKER_ID})`}
    />
  ));

  const nodesDisplay = nodes.map(node => (
    <GraphNodeDisplay
      key={node.getId()}
      applyDrag={applyDrag}
      color={graphOptions.getColor(node, 'nodes')}
      detail={detail}
      expandable={expandable[node.getId()]}
      handleClick={() => handleClick(node)}
      labelKey={graphOptions.nodePreview ? 'preview' : graphOptions.nodeLabelProp}
      node={node}
    />
  ));

  return (
    <div className="graph-wrapper">
      <GraphExpansionDialog
        expandExclusions={expandExclusions}
        links={links}
        node={expandNode}
        onClose={() => handleDialogClose('expansionDialogOpen')}
        onExpand={handleExpand}
        onStage={handleExpandExclusion}
        onStageAll={handleExpandCheckAll}
        onStageClass={handleExpandByClass}
        open={expansionDialogOpen}
      />
      <GraphOptionsPanel
        graphOptions={graphOptions}
        graphOptionsOpen={graphOptionsOpen}
        handleDialogClose={() => handleDialogClose('graphOptionsOpen')}
        handleGraphOptionsChange={handleGraphOptionsChange}
        linkLegendDisabled={linkLegendDisabled}
        propsMap={propsMap.current}
      />

      <div className="toolbar">
        <Tooltip placement="top" title="Graph options">
          <IconButton
            color="primary"
            id="graph-options-btn"
            onClick={openGraphOptions}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        <Tooltip placement="top" title="Copy share-able URL to clip-board">
          <IconButton
            color="primary"
            id="clipboard-copy-btn"
            onClick={() => copyURLToClipBoard(snackbar)}
          >
            <SaveStateIcon />
          </IconButton>
        </Tooltip>

        <Tooltip placement="top" title="Rerun Layout">
          <div className="refresh-wrapper">
            <IconButton
              color="primary"
              onClick={() => refresh()}
            >
              <RefreshIcon />
            </IconButton>
          </div>
        </Tooltip>
      </div>


      <div className="svg-wrapper" ref={(node) => { wrapper.current = node; }}>
        <svg
          onClick={(e) => {
            if (e.target === graph.current) {
              update({ actionsNode: null });
              handleClick();
            }
          }}
          ref={(node) => { graph.current = node; }}
        >
          <defs>
            <GraphArrowMarker />
          </defs>
          <g ref={(node) => { zoom.current = node; }}>
            {linksDisplay}
            {nodesDisplay}
            {actionsRing}
          </g>
        </svg>
      </div>
      <GraphLegend
        graphOptions={graphOptions}
        linkDisabled={linkLegendDisabled}
        onChange={handleGraphOptionsChange}
        propsMap={propsMap.current}
      />
    </div>
  );
}

GraphComponent.propTypes = {
  data: PropTypes.object.isRequired,
  getRecord: PropTypes.func.isRequired,
  handleDetailDrawerClose: PropTypes.func.isRequired,
  handleDetailDrawerOpen: PropTypes.func.isRequired,
  handleError: PropTypes.func.isRequired,
  detail: PropTypes.object,
  edgeTypes: PropTypes.arrayOf(PropTypes.string),
  handleGraphStateSave: PropTypes.func,
};

GraphComponent.defaultProps = {
  detail: null,
  edgeTypes: [],
  handleGraphStateSave: () => { },
};

export default GraphComponent;
