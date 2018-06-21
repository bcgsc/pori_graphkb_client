import React, { Component } from "react";
import ReactDOM from "react-dom";
import "./NodeDetail.css";
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Paper
} from "@material-ui/core";
import TimelineIcon from "@material-ui/icons/Timeline";
import AssignmentIcon from "@material-ui/icons/Assignment";
import Drawer from "@material-ui/core/Drawer";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import GraphComponent from "../GraphComponent/GraphComponent";
import { Link } from "react-router-dom";

class NodeDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: false,
      editNode: null,
      drawer: {
        graph: false,
        basic: false
      },
      graphOptions: {
        width: 0,
        height: 0,
        selectedColor: "#D33115",
        aliasesColor: "#FB9E00",
        parentsColor: "#AEA1FF",
        childrenColor: "#73D8FF"
      },
      colorKey: "selectedColor"
    };
    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
  }

  handleResize() {
    let w, h;
    let n = ReactDOM.findDOMNode(this.refs["graph-dim"]);

    if (n) {
      w = n.clientWidth;
      h = n.clientHeight - 51;
      let graphOptions = this.state.graphOptions;
      graphOptions.width = w;
      graphOptions.height = h;
      this.setState({ graphOptions });
    }
  }

  handleDrawer(key, value) {
    let drawer = this.state.drawer;
    drawer[key] = value;
    this.setState({ drawer }, this.handleResize);
  }

  render() {
    const node = this.props.node;

    const listItems = key => {
      if (node[key]) {
        return (
          <div className="list-subheader">
            <ListItemText
              primary={
                key[0].toUpperCase() + key.substr(1, key.length - 1) + ":"
              }
            />
            {node[key].map(item => {
              return (
                <ListItem key={key + item}>
                  <ListItemText secondary={item} />
                </ListItem>
              );
            })}
          </div>
        );
      } else return null;
    };

    const basicProperties = (
      <div className="node-properties">
        <List component="nav">
          <ListItem>
            <ListItemText primary="Class:" secondary={node.class} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Source:" secondary={node.source} />
          </ListItem>
          <ListItem>
            <ListItemText primary="SourceId:" secondary={node.sourceId} />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="CreatedBy:"
              secondary={node.createdBy || "Undefined"}
            />
          </ListItem>
          <ListItem>
            <ListItemText primary="Name:" secondary={node.name} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Description:" secondary={node.description} />
          </ListItem>
          {listItems("subsets")}
          {listItems("aliases")}
          {listItems("parents")}
          {listItems("children")}
          <ListItem className="edit-btn">
            <Link
              className="link"
              to={{
                state: { rid: node.rid },
                pathname: "/edit/" + node.rid.slice(1)
              }}
            >
              <Button variant="raised" color="primary">
                Edit Node
              </Button>
            </Link>
          </ListItem>
          <ListItem className="graph-btn" />
        </List>
      </div>
    );

    let graph = () => {
      if (
        this.state.graphOptions.width &&
        this.state.graphOptions.height &&
        this.state.drawer.graph
      ) {
        return (
          <GraphComponent
            width={this.state.graphOptions.width}
            height={this.state.graphOptions.height}
            handleClick={this.props.handleClick}
            node={node}
          />
        );
      } else return null;
    };

    const selected = key => key === this.state.colorKey;

    const graphDrawer = (
      <Drawer
        variant="persistent"
        anchor="right"
        open={this.state.drawer.graph}
        classes={{
          paper: "drawer-box-graph"
        }}
        onClose={() => this.handleDrawer("graph", false)}
        // SlideProps={{ unmountOnExit: true }}
      >
        <Paper elevation={5} className="graph-wrapper" ref="graph-dim">
          <IconButton
            className="close-btn"
            onClick={() => this.handleDrawer("graph", false)}
          >
            <span>Close</span> <ChevronRightIcon />
          </IconButton>
          {graph()}
        </Paper>
      </Drawer>
    );

    const basicDrawer = (
      <Drawer
        variant="persistent"
        anchor="right"
        open={this.state.drawer.basic}
        classes={{
          paper: "drawer-box-basic"
        }}
        onClose={() => this.handleDrawer("basic", false)}
        SlideProps={{ unmountOnExit: true }}
      >
        <Paper className="basic-wrapper">
          <IconButton onClick={() => this.handleDrawer("basic", false)}>
            <ChevronRightIcon />
          </IconButton>
          {basicProperties}
        </Paper>
      </Drawer>
    );

    return (
      <div className="node-wrapper">
        {basicDrawer}
        {graphDrawer}
        <Paper className="detail-wrapper">
          <div className="basic-btn">
            <div className="btn-wrapper">
              <IconButton
                className="basic"
                onClick={() =>
                  this.handleDrawer("basic", !this.state.drawer.basic)
                }
              >
                <AssignmentIcon />
              </IconButton>
            </div>
            <div className="btn-wrapper">
              <IconButton
                color="secondary"
                onClick={() => this.handleDrawer("graph", true)}
              >
                <TimelineIcon />
              </IconButton>
            </div>
          </div>
        </Paper>
        <IconButton
          color="secondary"
          onClick={() => this.handleDrawer("graph", true)}
        >
          <TimelineIcon />
        </IconButton>
        {basicProperties}
      </div>
    );
  }
}
export default NodeDetail;
