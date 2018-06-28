import React, { Component } from "react";
import ReactDOM from "react-dom";
import "./EditNodeView.css";
import {
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Button,
  Typography
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import CloseIcon from "@material-ui/icons/Close";
import FolderIcon from "@material-ui/icons/Folder";
import TrendingFlatIcon from "@material-ui/icons/TrendingFlat";
import AutoSearchComponent from "../../components/AutoSearchComponent/AutoSearchComponent";
import ResourceSelectComponent from "../../components/ResourceSelectComponent/ResourceSelectComponent";
import api from "../../services/api";
import * as jc from "json-cycle";

//TODO: Implement variants
class EditNodeView extends Component {
  constructor(props) {
    super(props);
    console.log(props.node);

    this.state = {
      "@rid": props.node["@rid"],
      name: props.node.name || "",
      longName: props.node.longName || "",
      description: props.node.description || "",
      sourceIdVersion: props.node.sourceIdVersion || "",
      subsets: props.node.subsets || [],
      subset: "",
      relationship: {
        type: "",
        direction: "out",
        targetName: "",
        targetRid: ""
      },
      relationships: [],
      subsets: [],
      edgeTypes: []
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubsetAdd = this.handleSubsetAdd.bind(this);
    this.handleSubsetDelete = this.handleSubsetDelete.bind(this);
    this.handleRelationshipAdd = this.handleRelationshipAdd.bind(this);
    this.handleRelationship = this.handleRelationship.bind(this);
    this.handleRelationshipDirection = this.handleRelationshipDirection.bind(
      this
    );
    this.handleRelationshipDelete = this.handleRelationshipDelete.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.loadEdges = this.loadEdges.bind(this);
    this.initNode = this.initNode.bind(this);
  }

  componentDidMount() {
    api.getEdgeTypes().then(edgeTypes => {
      this.setState({ edgeTypes }, this.initNode);
    });
  }

  initNode() {
    function processRelationships(node, relationships, key) {
      node[key].forEach(edge => {
        relationships.push({
          in: edge.in["@rid"],
          out: edge.out["@rid"],
          type: key,
          targetName: edge.in.name === node.name ? edge.out.name : edge.in.name,
          targetRid:
            edge.in["@rid"] === node["@rid"]
              ? edge.out["@rid"]
              : edge.in["@rid"]
        });
      });
      return relationships;
    }
    api
      .get("/diseases/" + this.state["@rid"].slice(1) + "?neighbors=3")
      .then(response => {
        response = jc.retrocycle(response.result);
        let relationships = [];
        this.state.edgeTypes.forEach(type => {
          if (response["in_" + type]) {
            relationships = processRelationships(
              response,
              relationships,
              "in_" + type
            );
          }
          if (response["out_" + type]) {
            relationships = processRelationships(
              response,
              relationships,
              "out_" + type
            );
          }
        });

        this.setState({
          ...response,
          rid: response["@rid"],
          sourceName: response.source.name,
          relationships
        });
      });
  }

  handleChange(e) {
    console.log(e.target);
    this.setState({ [e.target.name]: e.target.value }, console.log(this.state));
  }

  handleSubsetAdd() {
    if (this.state.subset) {
      const subsets = this.state.subsets;
      subsets.push(this.state.subset);
      this.setState({ subsets, subset: "" });
    }
  }
  handleSubsetDelete(subset) {
    const subsets = this.state.subsets;
    if (subsets.indexOf(subset) !== -1) {
      subsets.splice(subsets.indexOf(subset), 1);
    }
    this.setState({ subsets });
  }
  handleRelationshipAdd() {
    const { relationship, relationships } = this.state;
    if (relationship.targetRid && relationship.type && relationship.direction) {
      if (
        relationships.filter(
          r =>
            r.targetRid === relationship.targetRid &&
            r.type === relationship.type
        ).length === 0
      ) {
        relationships.push(relationship);
        this.setState({
          relationships,
          relationship: {
            type: "",
            direction: "out",
            targetName: "",
            targetRid: ""
          }
        });
      }
    }
  }
  handleRelationshipDelete(relationship) {
    const relationships = this.state.relationships;
    if (relationships.indexOf(relationship) !== -1) {
      relationships.splice(relationships.indexOf(relationship), 1);
    }
    this.setState({ relationships });
  }
  handleRelationship(e) {
    const relationship = this.state.relationship;
    relationship[e.target.name] = e.target.value;
    relationship["targetRid"] = e.target["@rid"];
    this.setState({ relationship });
  }
  handleRelationshipDirection(e) {
    const relationship = this.state.relationship;
    if (relationship.direction === "out") {
      relationship.direction = "in";
      relationship.type = "in_" + relationship.type.split("_")[1];
    } else {
      relationship.direction = "out";
      relationship.type = "out_" + relationship.type.split("_")[1];
    }
    this.setState({ relationship });
  }
  handleSubmit(e) {
    e.preventDefault();
    const mainFields = {
      name: this.state.name,
      longName: this.state.longName,
      description: this.state.description,
      sourceIdVersion: this.state.sourceIdVersion,
      subsets: this.state.subsets
    };

    api
      .patch("/diseases/" + this.state["@rid"].slice(1), mainFields)
      .then(response => {
        console.log(response);
      })
      .catch(e => console.log(e));
  }

  loadEdges() {
    if (!this.state.edgeTypes || this.state.edgeTypes.length === 0) {
      return api.loadEdges();
    } else {
      return Promise.resolve(this.state.edgeTypes);
    }
  }

  render() {
    const subsets = this.state.subsets.map(subset => {
      return (
        <ListItem key={subset}>
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText primary={subset} style={{ overflow: "auto" }} />
          <IconButton
            onClick={e => {
              this.handleSubsetDelete(subset);
            }}
          >
            <CloseIcon color="error" />
          </IconButton>
        </ListItem>
      );
    });
    const relationships = this.state.relationships.map(relationship => {
      return (
        <ListItem key={relationship.type + ": " + relationship.targetName}>
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText
            primary={relationship.type + ": " + relationship.targetName}
            style={{ overflow: "auto" }}
          />
          <IconButton
            color="secondary"
            onClick={e => {
              this.handleRelationshipDelete(relationship);
            }}
          >
            <CloseIcon color="error" />
          </IconButton>
        </ListItem>
      );
    });
    const edgeTypesDisplay = edgeType => (
      <MenuItem
        key={edgeType.name}
        value={this.state.relationship.direction + "_" + edgeType.name}
      >
        {this.state.relationship.direction + "_" + edgeType.name}
      </MenuItem>
    );

    return (
      <div className="edit-node-wrapper">
        {/* Style */}
        <form onSubmit={this.handleSubmit}>
          <div className="param-section">
            <Typography variant="title">Edit Term Parameters</Typography>
            <List component="nav">
              <ListItem>
                <ListItemText
                  primary="Source:"
                  secondary={this.state.sourceName}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Source ID:"
                  secondary={this.state.sourceId}
                />
              </ListItem>

              <ListItem className="input-wrapper">
                <TextField
                  id="name"
                  placeholder="eg. angiosarcoma"
                  label="Name"
                  value={this.state.name}
                  onChange={this.handleChange}
                  className="text-input"
                  name="name"
                />
              </ListItem>
              <ListItem className="input-wrapper">
                <TextField
                  id="longName"
                  label="Long Name"
                  value={this.state.longName}
                  onChange={this.handleChange}
                  className="text-input"
                  name="longName"
                  multiline
                />
              </ListItem>
              <ListItem className="input-wrapper">
                <TextField
                  id="description"
                  label="Description"
                  value={this.state.description}
                  onChange={this.handleChange}
                  className="text-input"
                  name="description"
                  multiline
                />
              </ListItem>
              <ListItem className="input-wrapper">
                <TextField
                  id="sourceIdVersion"
                  label="Source ID Version"
                  value={this.state.sourceIdVersion}
                  onChange={this.handleChange}
                  className="text-input"
                  name="sourceIdVersion"
                />
              </ListItem>
            </List>
          </div>
          <div className="param-section">
            <Typography variant="title">Subsets</Typography>
            <ListItem className="input-wrapper">
              <TextField
                id="subset-temp"
                label="Add a Subset"
                value={this.state.subset}
                onChange={this.handleChange}
                className="text-input"
                name="subset"
                onKeyDown={e => {
                  if (e.keyCode === 13) {
                    this.handleSubsetAdd();
                  }
                }}
              />
              <IconButton color="primary" onClick={this.handleSubsetAdd}>
                <AddIcon />
              </IconButton>
            </ListItem>
            <List className="list">{subsets}</List>
          </div>
          <div className="param-section">
            <Typography variant="title">Relationships</Typography>
            <ListItem
              className="input-wrapper relationship-add-wrapper"
              onKeyDown={e => {
                if (e.keyCode === 13) this.handleRelationshipAdd();
              }}
            >
              <div className="relationship-dir-type">
                <IconButton
                  disableRipple
                  name="direction"
                  onClick={this.handleRelationshipDirection}
                  color="primary"
                >
                  <TrendingFlatIcon
                    style={{ margin: "20px 24px 0 0" }}
                    className={
                      this.state.relationship.direction === "in"
                        ? "relationship-in"
                        : "relationship-out"
                    }
                  />
                </IconButton>
                <ResourceSelectComponent
                  value={this.state.relationship.type}
                  onChange={this.handleRelationship}
                  name="type"
                  label="Type"
                >
                  {edgeTypesDisplay}
                </ResourceSelectComponent>
              </div>
              <div className="search-wrap">
                <AutoSearchComponent
                  value={this.state.relationship.targetName}
                  onChange={this.handleRelationship}
                  placeholder="Target Name"
                  limit={10}
                  name="targetName"
                />
                <IconButton
                  color="primary"
                  onClick={this.handleRelationshipAdd}
                >
                  <AddIcon />
                </IconButton>
              </div>
            </ListItem>
            <List className="list">{relationships}</List>
          </div>
          <div className="submit-button">
            <Button type="submit" variant="outlined">
              Confirm Changes
            </Button>
          </div>
        </form>
      </div>
    );
  }
}
export default EditNodeView;
