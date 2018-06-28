import React, { Component } from "react";
import ReactDOM from "react-dom";
import "./NodeDetailComponent.css";
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
import AssignmentIcon from "@material-ui/icons/Assignment";
import Drawer from "@material-ui/core/Drawer";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import GraphComponent from "../GraphComponent/GraphComponent";
import { Link } from "react-router-dom";

class NodeDetailComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

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
                  edge.in && edge.in["@rid"] === node["@rid"]
                    ? edge.out
                    : edge.in;
                return (
                  <ListItem dense key={key + edge["@rid"]}>
                    <ListItemText
                      secondary={
                        relatedNode
                          ? relatedNode.name +
                            " | " +
                            relatedNode.sourceId +
                            " : " +
                            edge.source.name
                          : edge
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
      return node.subsets && node.subsets.length !== 0 ? (
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

    return (
      <div className="node-wrapper">
        <Card>
          <div className="node-edit-btn">
            <IconButton onClick={() => this.props.handleNodeEdit(node)}>
              <AssignmentIcon />
            </IconButton>
          </div>
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
        </Card>
      </div>
    );
  }
}
export default NodeDetailComponent;
