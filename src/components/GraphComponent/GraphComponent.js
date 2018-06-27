import React, { Component } from "react";
import "./GraphComponent.css";
import * as d3 from "d3";
import ReactDOM from "react-dom";
import SVGLink from "../SVGLink/SVGLink";
import SVGNode from "../SVGNode/SVGNode";
import Api from "../../services/api";
import {
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  IconButton
} from "@material-ui/core";
import ViewListIcon from "@material-ui/icons/ViewList";
import EditIcon from "@material-ui/icons/Edit";
import { CompactPicker } from "react-color";
import { Link } from "react-router-dom";
import queryString from "query-string";

const R = 55;
const arrowWidth = 6;
const arrowLength = 9;
const nodeR = 4;
const edgeTypes = [
  "in_SubClassOf",
  "out_SubClassOf",
  "in_AliasOf",
  "out_AliasOf"
];
class GraphComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      api: new Api(),
      nodes: [],
      links: [],
      graphObjects: {},
      simulation: d3.forceSimulation(),
      svg: undefined,
      selectedChildren: [],
      selectedParents: [],
      selectedAliases: [],
      graphOptions: {
        width: 0,
        height: 0,
        selectedColor: "#D33115",
        aliasesColor: "#FB9E00",
        parentsColor: "#AEA1FF",
        childrenColor: "#73D8FF",
        defaultColor: "#1F265B",
        linkStrength: 1 / 30,
        chargeStrength: 100,
        collisionRadius: 4,
        autoCollisionRadius: false
      },
      colorKey: "selectedColor",
      expandable: {}
    };

    this.drawGraph = this.drawGraph.bind(this);
    this.initSimulation = this.initSimulation.bind(this);
    this.getNeighbors = this.getNeighbors.bind(this);
    this.updateColors = this.updateColors.bind(this);
    this.handleColorPick = this.handleColorPick.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleGraphOptionsChange = this.handleGraphOptionsChange.bind(this);
  }

  componentDidMount() {
    const start = performance.now();
    let displayed = this.props.displayed;
    this.handleResize();
    const a = performance.now();
    console.log(a - start);
    const neighbors = queryString.parse(this.props.search).neighbors;
    if (!displayed || displayed.length === 0) {
      displayed = [this.props.selectedId];
    }
    displayed.forEach(key => {
      let nodes = this.state.nodes;
      let links = this.state.links;
      let graphObjects = this.state.graphObjects;
      if (!graphObjects[key]) {
        nodes.push({ data: this.props.data[key] });
        graphObjects["" + key] = this.props.data[key];
      }
      this.props.handleNodeAdd(this.props.data[key]);
      this.setState(
        {
          ...this.processData(
            this.props.data[key],
            { x: 0, y: 0 },
            nodes,
            links,
            graphObjects,
            Math.floor(neighbors / 2) + 1
          )
        },
        () => {
          nodes = this.state.nodes;
          links = this.state.links;
          graphObjects = this.state.graphObjects;
        }
      );
    });
    const b = performance.now();
    console.log(b - a);
    this.drawGraph();
    const c = performance.now();
    console.log(c - b);
    this.updateColors(displayed[0]);
    const e = performance.now();
    console.log(e - c);
    window.addEventListener("resize", this.handleResize);
    console.log("done: " + (performance.now() - start));
  }

  handleResize() {
    let w, h;
    let n = ReactDOM.findDOMNode(this.refs["wrapper"]);
    if (n) {
      w = n.clientWidth;
      h = n.clientHeight;
      let graphOptions = this.state.graphOptions;
      graphOptions.width = w;
      graphOptions.height = h;
      this.setState({ graphOptions }, this.initSimulation);
    }
  }
  handleCheckbox() {
    const graphOptions = this.state.graphOptions;
    graphOptions.autoCollisionRadius = !graphOptions.autoCollisionRadius;
  }
  processData(node, position, nodes, links, graphObjects, depth) {
    edgeTypes.forEach(edgeType => {
      if (node[edgeType]) {
        const n = node[edgeType].length;
        let j = 0;

        node[edgeType].forEach(edge => {
          const edgeRid = edge["@rid"] || edge;

          if (!graphObjects[edgeRid]) {
            const expandable = this.state.expandable;
            if (
              edge["@rid"] &&
              edge.in["@rid"] &&
              edge.out["@rid"] &&
              depth !== 0
            ) {
              const link = {
                source: edge.out["@rid"],
                target: edge.in["@rid"],
                type: edgeType
                  .split("_")[1]
                  .split("Of")[0]
                  .toLowerCase(),
                "@rid": edge["@rid"]
              };
              links.push(link);
              graphObjects[link["@rid"]] = link;
              delete expandable[edge.in["@rid"]];
              delete expandable[edge.out["@rid"]];

              if (!graphObjects[edge.out["@rid"]]) {
                let positionInit = this.positionInit(
                  position.x,
                  position.y,
                  j++,
                  n,
                  R
                );
                const newNode = {
                  data: edge.out,
                  x: positionInit.x,
                  y: positionInit.y
                };
                nodes.push(newNode);
                graphObjects[newNode.data["@rid"]] = newNode;

                const d = this.processData(
                  edge.out,
                  positionInit,
                  nodes,
                  links,
                  graphObjects,
                  depth - 1
                );
                nodes = d.nodes;
                links = d.links;
                graphObjects = d.graphObjects;
              }
              if (!graphObjects[edge.in["@rid"]]) {
                let positionInit = this.positionInit(
                  position.x,
                  position.y,
                  j++,
                  n,
                  R
                );
                const newNode = {
                  data: edge.in,
                  x: positionInit.x,
                  y: positionInit.y
                };
                nodes.push(newNode);
                graphObjects[newNode.data["@rid"]] = newNode;
                const d = this.processData(
                  newNode.data,
                  positionInit,
                  nodes,
                  links,
                  graphObjects,
                  depth - 1
                );
                nodes = d.nodes;
                links = d.links;
                graphObjects = d.graphObjects;
              }
            } else {
              expandable[node["@rid"]] = true;
            }
            this.setState({ expandable });
          }
        });
      }
    });
    return { nodes: nodes, links: links, graphObjects: graphObjects };
  }

  getNeighbors(node) {
    const { expandable } = this.state;

    //Maintain data invariant
    const depth = 3;
    let url = "/diseases/" + node.data["@rid"].slice(1) + "?neighbors=" + depth;
    if (expandable[node.data["@rid"]]) {
      this.state.api.get(url).then(response => {
        this.setState({
          ...this.processData(
            response,
            { x: node.x, y: node.y },
            this.state.nodes,
            this.state.links,
            this.state.graphObjects,
            Math.floor(depth / 2) + 1
          )
        });
        this.props.handleNodeAdd(response);
        this.drawGraph();
        this.updateColors(node.data["@rid"]);
      });
    } else {
      this.props.handleNodeAdd(node.data);
    }

    delete expandable[node.data["@rid"]];
    this.setState({ expandable });
  }

  componentWillUnmount() {
    //remove all event listeners
    this.state.svg.call(d3.zoom().on("zoom", null));
    this.state.simulation.on("tick", null);
    window.removeEventListener("resize", this.handleResize);
  }

  initSimulation() {
    let simulation = this.state.simulation
      .force("link", d3.forceLink().id(d => d.data["@rid"]))
      .force(
        "collide",
        d3.forceCollide(d => {
          if (this.state.graphOptions.autoCollisionRadius) {
            return d.data.name.length * 2.8;
          } else {
            return this.state.graphOptions.collisionRadius;
          }
        })
      ) //Can change these to make nodes more readable
      .force(
        "charge",
        d3.forceManyBody().strength(-this.state.graphOptions.chargeStrength)
      )
      .force(
        "center",
        d3.forceCenter(
          this.state.graphOptions.width / 2,
          this.state.graphOptions.height / 2
        )
      );

    let container = d3.select(ReactDOM.findDOMNode(this.refs.zoom));

    let svg = d3.select(ReactDOM.findDOMNode(this.refs.graph));
    svg
      .attr("width", this.state.graphOptions.width)
      .attr("height", this.state.graphOptions.height)
      .call(
        d3.zoom().on("zoom", () => {
          const transform = d3.event.transform;
          container.attr(
            "transform",
            "translate(" +
              transform.x +
              "," +
              transform.y +
              ")scale(" +
              transform.k +
              ")"
          );
        })
      );

    this.setState({ simulation: simulation, svg: svg });
  }

  drawGraph() {
    const nodes = this.state.nodes;
    const links = this.state.links;
    const simulation = this.state.simulation;

    simulation.nodes(nodes);

    simulation.force(
      "links",
      d3
        .forceLink(links)
        .strength(this.state.graphOptions.linkStrength)
        .id(d => {
          return d.data["@rid"];
        })
    );

    var ticked = () => {
      this.setState({
        links: links,
        nodes: nodes
      });
    };

    simulation.on("tick", ticked);
    simulation.restart();
    this.setState({ simulation: simulation });
  }

  positionInit(x, y, i, n, R) {
    x = R * Math.cos((2 * Math.PI * i - Math.PI / 6) / n) + x;
    y = R * Math.sin((2 * Math.PI * i - Math.PI / 6) / n) + y;
    return { x: x, y: y };
  }

  updateColors(rid) {
    const links = this.state.links,
      selectedAliases = [],
      selectedChildren = [],
      selectedParents = [];

    links.forEach(link => {
      const targetRid = link.target.data
        ? link.target.data["@rid"]
        : link.target;
      const sourceRid = link.source.data
        ? link.source.data["@rid"]
        : link.source;

      if (targetRid === rid) {
        if (link.type === "alias") {
          selectedAliases.push(sourceRid);
        } else {
          selectedChildren.push(sourceRid);
        }
      }
      if (sourceRid === rid) {
        if (link.type === "alias") {
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
      selectedParents
    });
  }

  handleClick(e, node) {
    this.props.handleClick(node.data["@rid"]);
    if (node.data["@rid"] === this.state.expandId) {
      e.stopPropagation();
      this.getNeighbors(node);
    } else {
      this.updateColors(node.data["@rid"]);
    }
  }
  handleColorPick(color) {
    let graphOptions = this.state.graphOptions;
    graphOptions[this.state.colorKey] = color.hex;
    this.setState({ graphOptions });
  }
  handleColorKeyChange(key) {
    this.setState({ colorKey: key });
  }
  handleGraphOptionsChange(e) {
    const graphOptions = this.state.graphOptions;
    graphOptions[e.target.name] = e.target.value;
    this.setState({ graphOptions }, () => {
      this.initSimulation();
      this.drawGraph();
    });
  }

  render() {
    const links = this.state.links.map(link => {
      return <SVGLink key={link["@rid"]} link={link} />;
    });
    const nodes = this.state.nodes.map(node => {
      const color =
        this.state.expandId === node.data["@rid"]
          ? this.state.graphOptions.selectedColor
          : this.state.selectedChildren.includes(node.data["@rid"])
            ? this.state.graphOptions.childrenColor
            : this.state.selectedParents.includes(node.data["@rid"])
              ? this.state.graphOptions.parentsColor
              : this.state.selectedAliases.includes(node.data["@rid"])
                ? this.state.graphOptions.aliasesColor
                : this.state.graphOptions.defaultColor;
      const expandable = this.state.expandable[node.data["@rid"]];
      return (
        <SVGNode
          key={"node" + node.data["@rid"]}
          node={node}
          simulation={this.state.simulation}
          color={color}
          r={nodeR}
          handleClick={e => this.handleClick(e, node)}
          expandable={expandable}
        />
      );
    });

    const selected = key => key === this.state.colorKey;

    const arrowSize = {
      d: "M0,0 L0," + arrowWidth + " L" + arrowLength + ", " + arrowWidth / 2,
      refX: nodeR + arrowLength + 1,
      refY: arrowWidth / 2
    };

    return (
      <div className="graph-wrapper">
        <div className="toolbar">
          <Link
            style={{ margin: "4px 12px" }}
            to={{
              pathname: "/data/table",
              search: this.props.search,
              state: this.state.displayed
            }}
          >
            <IconButton
              color="secondary"
              style={{
                backgroundColor: "rgba(0, 137, 123, 0.1)"
              }}
            >
              <ViewListIcon />
            </IconButton>
          </Link>
          <div className="compact-picker">
            <CompactPicker
              color={this.state.graphOptions[this.state.colorKey]}
              onChangeComplete={this.handleColorPick}
            />
          </div>
          <div className="grid-wrapper">
            <div className="button-grid">
              <Button
                style={{ color: this.state.graphOptions.selectedColor }}
                onClick={e => this.handleColorKeyChange("selectedColor")}
                variant={selected("selectedColor") ? "outlined" : "flat"}
              >
                Selected
              </Button>
              <Button
                style={{ color: this.state.graphOptions.parentsColor }}
                onClick={e => this.handleColorKeyChange("parentsColor")}
                variant={selected("parentsColor") ? "outlined" : "flat"}
              >
                Parents
              </Button>
              <Button
                style={{ color: this.state.graphOptions.childrenColor }}
                onClick={e => this.handleColorKeyChange("childrenColor")}
                variant={selected("childrenColor") ? "outlined" : "flat"}
              >
                Children
              </Button>
              <Button
                style={{ color: this.state.graphOptions.aliasesColor }}
                onClick={e => this.handleColorKeyChange("aliasesColor")}
                variant={selected("aliasesColor") ? "outlined" : "flat"}
              >
                Aliases
              </Button>
            </div>
          </div>
          <div className="graph-options-wrapper">
            <div className="graph-options-grid">
              <div className="graph-input-wrapper">
                <span>Link Strength</span>
                <div className="graph-input">
                  <input
                    label="Link Strength"
                    name="linkStrength"
                    type="number"
                    value={this.state.graphOptions.linkStrength}
                    onChange={this.handleGraphOptionsChange}
                  />
                </div>
              </div>
              <div className="graph-input-wrapper">
                <span>Charge Strength</span>
                <div className="graph-input">
                  <input
                    label="Charge Strength"
                    name="chargeStrength"
                    type="number"
                    value={this.state.graphOptions.chargeStrength}
                    onChange={this.handleGraphOptionsChange}
                  />
                </div>
              </div>
              <div className="graph-input-wrapper">
                <span>Collision Radius</span>
                <div className="graph-input">
                  <input
                    label="Collision Radius"
                    name="collisionRadius"
                    type="number"
                    value={this.state.graphOptions.collisionRadius}
                    onChange={this.handleGraphOptionsChange}
                  />
                </div>
              </div>
              <div className="graph-input-wrapper">
                <FormControlLabel
                  classes={{
                    root: "checkbox-wrapper",
                    label: "checkbox-label"
                  }}
                  control={
                    <Checkbox
                      onChange={e =>
                        this.handleGraphOptionsChange({
                          target: {
                            value: e.target.checked,
                            name: e.target.name
                          }
                        })
                      }
                      name="autoCollisionRadius"
                      checked={this.state.graphOptions.autoCollisionRadius}
                    />
                  }
                  label="Auto Collision Radius"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="svg-wrapper" ref="wrapper">
          <div className="node-options">
            <IconButton>
              <EditIcon />
            </IconButton>
          </div>
          <svg ref="graph">
            <defs>
              <marker
                id="arrow"
                markerWidth={arrowLength}
                markerHeight={arrowWidth}
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
              {links}
              {nodes}
            </g>
          </svg>
        </div>
      </div>
    );
  }
}
export default GraphComponent;
