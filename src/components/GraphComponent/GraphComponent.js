import React, { Component } from "react";
import "./GraphComponent.css";
import * as d3 from "d3";
import ReactDOM from "react-dom";
import SVGLink from "../SVGLink/SVGLink";
import SVGNode from "../SVGNode/SVGNode";
import api from "../../services/api";
import { Button, Paper } from "@material-ui/core";
import { CompactPicker } from "react-color";

const R = 55;

class GraphComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      nodes: [],
      links: [],
      linkStrength: 1 / 30,
      simulation: d3.forceSimulation(),
      svg: undefined,
      node: this.props.node,
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
        defaultColor: "#1F265B"
      },
      colorKey: "selectedColor"
    };

    this.drawChart = this.drawChart.bind(this);
    this.initSimulation = this.initSimulation.bind(this);
    this.getNeighbors = this.getNeighbors.bind(this);
    this.getNeighbours = this.getNeighbors.bind(this);
    this.updateColors = this.updateColors.bind(this);
    this.handleColorPick = this.handleColorPick.bind(this);
  }

  componentDidMount() {
    this.initSimulation();
    const nodes = this.state.nodes;
    nodes.push({
      name: this.props.node.name,
      rid: this.props.node.rid,
      index: 0
    });
    this.setState({ nodes }, this.getNeighbors(this.props.node));

    window.addEventListener("resize", this.initSimulation);
  }

  getNeighbors(node) {
    const links = this.state.links;
    const nodes = this.state.nodes;
    const edgeTypes = [
      "in_SubClassOf",
      "out_SubClassOf",
      "in_AliasOf",
      "out_AliasOf"
    ];
    const depth = 2;
    const position = { x: node.x || 0, y: node.y || 0 };
    let url = "/diseases/" + node.rid.slice(1) + "?neighbors=" + depth;

    api.get(url).then(data => {
      edgeTypes.forEach(edgeType => {
        if (data[edgeType]) {
          let n = data[edgeType].length;
          let j = 0;
          data[edgeType].forEach(edge => {
            if (links.filter(l => l.rid === edge["@rid"]).length === 0) {
              links.push({
                source: edge.out["@rid"] || edge.out,
                target: edge.in["@rid"] || edge.in,
                type: edgeType
                  .split("_")[1]
                  .split("Of")[0]
                  .toLowerCase(),
                rid: edge["@rid"]
              });
            }

            if (
              edge.out["@rid"] &&
              nodes.filter(n => n.rid === edge.out["@rid"]).length === 0
            ) {
              let pos = this.positionInit(position.x, position.y, j++, n, R);
              nodes.push({
                name: edge.out.name,
                rid: edge.out["@rid"],
                x: pos.x,
                y: pos.y
              });
            }
            if (
              edge.in["@rid"] &&
              nodes.filter(n => n.rid === edge.in["@rid"]).length === 0
            ) {
              let pos = this.positionInit(position.x, position.y, j++, n, R);
              nodes.push({
                name: edge.in.name,
                rid: edge.in["@rid"],
                x: pos.x,
                y: pos.y
              });
            }
          });
        }
      });

      this.updateColors(data["@rid"]);
      this.setState(
        {
          nodes,
          links,
          selectedId: data["@rid"]
        },
        this.drawChart(nodes, links)
      );
    });
  }

  componentWillUnmount() {
    //remove all event listeners
    this.state.svg.call(d3.zoom().on("zoom", null));
    this.state.simulation.on("tick", null);
    window.removeEventListener("resize", this.initSimulation);
  }

  initSimulation() {
    let simulation = this.state.simulation
      .force("link", d3.forceLink().id(d => d.rid))
      .force(
        "collide",
        d3.forceCollide(d => {
          return d.name.length * 2.8;
        })
      ) //Can change these to make nodes more readable
      .force("charge", d3.forceManyBody())
      .force(
        "center",
        d3.forceCenter(this.props.width / 2, this.props.height / 2)
      );

    let container = d3.select(ReactDOM.findDOMNode(this.refs.zoom));

    let svg = d3.select(ReactDOM.findDOMNode(this.refs.graph));
    svg.attr("width", this.props.width).attr("height", this.props.height);

    svg.call(
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

  drawChart(nodes, links) {
    const simulation = this.state.simulation;

    simulation.nodes(nodes);

    simulation.force(
      "links",
      d3
        .forceLink(links)
        .strength(this.state.linkStrength)
        .id(d => {
          return d.rid;
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
      const targetRid = link.target.rid || link.target;
      const sourceRid = link.source.rid || link.source;

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
    if (node.rid === this.state.expandId) {
      e.stopPropagation();
      this.getNeighbors(node);
    } else {
      this.updateColors(node.rid);
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
  render() {
    let links = this.state.links.map(link => {
      return <SVGLink key={link.index} link={link} />;
    });
    let nodes = this.state.nodes.map(node => {
      const color =
        this.state.expandId === node.rid
          ? this.state.graphOptions.selectedColor
          : this.state.selectedChildren.includes(node.rid)
            ? this.state.graphOptions.childrenColor
            : this.state.selectedParents.includes(node.rid)
              ? this.state.graphOptions.parentsColor
              : this.state.selectedAliases.includes(node.rid)
                ? this.state.graphOptions.aliasesColor
                : this.state.graphOptions.defaultColor;
      return (
        <SVGNode
          key={"node" + node.rid}
          node={node}
          simulation={this.state.simulation}
          color={color}
          r={node.rid === this.state.expandId ? 4 : 4}
          handleClick={e => this.handleClick(e, node)}
        />
      );
    });
    const selected = key => key === this.state.colorKey;

    return (
      <div>
        <div className="color-picker">
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
        </div>
        <Paper>
          <svg ref="graph">
            <defs>
              <marker
                id="arrow"
                markerWidth="25"
                markerHeight="10"
                refX="11"
                refY="2"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,4 L6,2 z" fill="#555" />
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
        </Paper>
      </div>
    );
  }
}
export default GraphComponent;
