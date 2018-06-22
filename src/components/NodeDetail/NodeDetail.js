import React, { Component } from "react";
import ReactDOM from "react-dom";
import "./NodeDetail.css";
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Paper,
  Card,
  CardHeader,
  Typography
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
      // editing: false,
      // editNode: null,
      // drawer: {
      //   graph: false,
      //   basic: false
      // },
      // graphOptions: {
      //   width: 0,
      //   height: 0,
      //   selectedColor: "#D33115",
      //   aliasesColor: "#FB9E00",
      //   parentsColor: "#AEA1FF",
      //   childrenColor: "#73D8FF"
      // },
      // colorKey: "selectedColor"
    };
    // this.handleResize = this.handleResize.bind(this);
  }

  // componentDidMount() {
  //   window.addEventListener("resize", this.handleResize);
  //   this.handleResize();
  // }

  // handleResize() {
  //   let w, h;
  //   let n = ReactDOM.findDOMNode(this.refs["graph-dim"]);

  //   if (n) {
  //     w = n.clientWidth;
  //     h = n.clientHeight - 51;
  //     let graphOptions = this.state.graphOptions;
  //     graphOptions.width = w;
  //     graphOptions.height = h;
  //     this.setState({ graphOptions });
  //   }
  // }

  // handleDrawer(key, value) {
  //   let drawer = this.state.drawer;
  //   drawer[key] = value;
  //   this.setState({ drawer }, this.handleResize);
  // }

  render() {
    const node = this.props.node;

    const listEdges = key => {
      if (node[key]) {
        return (
          <React.Fragment>
            <Typography variant="subheading">{key + ":"}</Typography>
            {/*Format this*/}
            <List>
              {node[key].map(edge => {
                const relatedNode =
                  edge.in["@rid"] === node["@rid"] ? edge.out : edge.in;
                return (
                  <ListItem dense key={key + edge["@rid"]}>
                    <ListItemText
                      secondary={
                        relatedNode.name +
                        " | " +
                        relatedNode.sourceId +
                        " : " +
                        edge.source.name
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </React.Fragment>
        );
      } else return null;
    };
    const subsets = () => {
      return node.subsets ? (
        <React.Fragment>
          <Typography variant="subheading">Subsets:</Typography>
          <List>
            {node.subsets.map(subset => {
              return (
                <ListItem dense key={"subset" + subset}>
                  <ListItemText secondary={subset} />
                </ListItem>
              );
            })}
          </List>
        </React.Fragment>
      ) : null;
    };

    const basicProperties = (
      <Card>
        <div className="node-properties">
          <section className="basic-properties">
            <Typography variant="subheading"> Class: </Typography>
            <Typography paragraph variant="caption">
              {node["@class"]}
            </Typography>
            <Typography variant="subheading"> Description: </Typography>
            <Typography paragraph variant="caption">
              {node.description || "none"}
            </Typography>
            {subsets()}
          </section>
          <section className="listed-properties">
            {listEdges("out_AliasOf")}
            {listEdges("in_AliasOf")}
            {listEdges("out_SubClassOf")}
            {listEdges("in_SubClassOf")}
          </section>
        </div>
        {/* <ListItem className="edit-btn">
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
          </ListItem> */}
      </Card>
    );

    // let graph = () => {
    //   if (
    //     this.state.graphOptions.width &&
    //     this.state.graphOptions.height &&
    //     this.state.drawer.graph
    //   ) {
    //     return (
    //       <GraphComponent
    //         width={this.state.graphOptions.width}
    //         height={this.state.graphOptions.height}
    //         handleClick={this.props.handleClick}
    //         node={node}
    //       />
    //     );
    //   } else return null;
    // };

    // const selected = key => key === this.state.colorKey;

    // const graphDrawer = (
    //   <Drawer
    //     variant="persistent"
    //     anchor="right"
    //     open={this.state.drawer.graph}
    //     classes={{
    //       paper: "drawer-box-graph"
    //     }}
    //     onClose={() => this.handleDrawer("graph", false)}
    //     // SlideProps={{ unmountOnExit: true }}
    //   >
    //     <Paper elevation={5} className="graph-wrapper" ref="graph-dim">
    //       <IconButton
    //         className="close-btn"
    //         onClick={() => this.handleDrawer("graph", false)}
    //       >
    //         <span>Close</span> <ChevronRightIcon />
    //       </IconButton>
    //       {graph()}
    //     </Paper>
    //   </Drawer>
    // );

    // const basicDrawer = (
    //   <Drawer
    //     variant="persistent"
    //     anchor="right"
    //     open={this.state.drawer.basic}
    //     classes={{
    //       paper: "drawer-box-basic"
    //     }}
    //     onClose={() => this.handleDrawer("basic", false)}
    //     SlideProps={{ unmountOnExit: true }}
    //   >
    //     <Paper className="basic-wrapper">
    //       <IconButton onClick={() => this.handleDrawer("basic", false)}>
    //         <ChevronRightIcon />
    //       </IconButton>
    //       {basicProperties}
    //     </Paper>
    //   </Drawer>
    // );

    return (
      <div className="node-wrapper">
        {/* {basicDrawer}
        {graphDrawer} */}
        {/* <Paper className="detail-wrapper">
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
        </Paper> */}
        {/* <IconButton
          color="secondary"
          onClick={() => this.handleDrawer("graph", true)}
        >
          <TimelineIcon />
        </IconButton> */}
        {basicProperties}
      </div>
    );
  }
}
export default NodeDetail;
