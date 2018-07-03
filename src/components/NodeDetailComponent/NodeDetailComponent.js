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
  render() {
    const node = this.props.node;

    const listEdges = key => {
      const label = key.startsWith("in_")
        ? "has" + key.split("_")[1].slice(0, key.split("_")[1].length - 2)
        : key.split("_")[1];
      if (node[key]) {
        return (
          <React.Fragment>
            <Typography variant="subheading">{label + ":"}</Typography>
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
      <Card className="node-wrapper">
        <div className="node-edit-btn">
          <IconButton
            onClick={() => this.props.handleNodeEditStart(node["@rid"])}
          >
            <AssignmentIcon />
          </IconButton>
        </div>
        <div className="node-properties">
          <section className="basic-properties">
            <Typography variant="subheading"> Class: </Typography>
            <Typography paragraph variant="caption">
              {node["@class"]}
            </Typography>
            <Typography variant="subheading"> Source: </Typography>
            <Typography paragraph variant="caption">
              {node.source.name || "none"}
            </Typography>
            <Typography variant="subheading"> Source ID: </Typography>
            <Typography paragraph variant="caption">
              {node.sourceId || "none"}
            </Typography>
            <Typography variant="subheading"> Name: </Typography>
            <Typography paragraph variant="caption">
              {node.name || "none"}
            </Typography>
            <Typography variant="subheading"> Description: </Typography>
            <Typography paragraph variant="caption">
              {node.description || "none"}
            </Typography>
            <Typography variant="subheading"> Long Name: </Typography>
            <Typography paragraph variant="caption">
              {node.longName || "none"}
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
    );
  }
}
export default NodeDetailComponent;
