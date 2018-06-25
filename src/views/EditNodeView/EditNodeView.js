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
import api from "../../services/api";

//TODO: Implement variants
class EditNodeView extends Component {
  constructor(props) {
    super(props);
    const mainFields = {
      "@rid": props.node["@rid"],
      name: props.node.name,
      longName: props.node.longName,
      description: props.node.description,
      sourceIdVersion: props.node.sourceIdVersion,
      subsets: props.node.subsets || []
    };
    this.state = {
      ...mainFields,
      subset: "",
      relationship: {
        type: "",
        direction: "out",
        targetName: "",
        targetRid: ""
      },
      relationships: [],
      subsets: [],
      loadedEdges: !!localStorage.getItem("edgeTypes")
    };
    this.handleMainPayloadChange = this.handleMainPayloadChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubsetAdd = this.handleSubsetAdd.bind(this);
    this.handleRelationshipAdd = this.handleRelationshipAdd.bind(this);
    this.handleRelationship = this.handleRelationship.bind(this);
    this.handleRelationshipDirection = this.handleRelationshipDirection.bind(
      this
    );
    this.handleRelationshipDelete = this.handleRelationshipDelete.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    const edgeTypes = [
      "in_SubClassOf",
      "out_SubClassOf",
      "in_AliasOf",
      "out_AliasOf"
    ];
    api
      .get("/diseases/" + this.state["@rid"].slice(1) + "?neighbors=2")
      .then(response => {
        const relationships = [];
        edgeTypes.forEach(type => {
          if (response[type]) {
            response[type].forEach(edge => {
              relationships.push({
                in: edge.in["@rid"],
                out: edge.out["@rid"],
                type: type,
                targetName:
                  edge.in.name === response.name ? edge.out.name : edge.in.name,
                targetRid:
                  edge.in["@rid"] === response["@rid"]
                    ? edge.out["@rid"]
                    : edge.in["@rid"]
              });
            });
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

  handleMainPayloadChange(e) {
    const node = this.state;
    node[e.target.name] = e.target.value;
    this.setState({ node });
  }
  handleSubsetAdd() {
    const subsets = this.state.subsets;
    subsets.push(this.state.subset);
    this.setState({ subsets, subset: "" });
  }
  handleSubsetDelete(subset) {
    const subsets = this.state.subsets;
    if (subsets.indexOf(subset) !== -1) {
      subsets.splice(subsets.indexOf(subset));
    }
    this.setState({ subsets });
  }
  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }
  handleRelationshipAdd() {
    const { relationship, relationships } = this.state;
    if (relationship.targetRid && relationship.type && relationship.direction) {
      const type = relationship.direction + "_" + relationship.type;
      if (
        relationships.filter(
          r => r.targetRid === relationship.targetRid && r.type === type
        ).length === 0
      ) {
        relationship.type = relationship.direction + "_" + relationship.type;
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
      relationships.splice(relationships.indexOf(relationship));
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
    relationship.direction = relationship.direction === "out" ? "in" : "out";
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
      });
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
    const edgeTypes = () => {
      if (this.state.loadedEdges) {
        return JSON.parse(localStorage.getItem("edgeTypes")).map(edgeType => (
          <MenuItem key={edgeType} value={edgeType}>
            {edgeType}
          </MenuItem>
        ));
      } else {
        api.get("/schema").then(response => {
          const list = [];
          Object.keys(response).forEach(key => {
            if (response[key].inherits.includes("E")) {
              list.push(key);
            }
          });
          localStorage.setItem("edgeTypes", JSON.stringify(list));
          this.setState({ loadedEdges: true });
        });
      }
    };

    return (
      <div className="edit-node-wrapper">
        {/* Style */}
        <IconButton
          onClick={this.props.handleDrawer}
          className="close-drawer-btn"
        >
          <CloseIcon color="error" />
        </IconButton>

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
                  onChange={this.handleMainPayloadChange}
                  className="text-input"
                  name="name"
                />
              </ListItem>
              <ListItem className="input-wrapper">
                <TextField
                  id="longName"
                  label="Long Name"
                  value={this.state.longName}
                  onChange={this.handleMainPayloadChange}
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
                  onChange={this.handleMainPayloadChange}
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
                  onChange={this.handleMainPayloadChange}
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
                <FormControl className="type-select">
                  <InputLabel htmlFor="relation-type">Type</InputLabel>
                  <Select
                    value={this.state.relationship.type}
                    onChange={this.handleRelationship}
                    inputProps={{
                      name: "type",
                      id: "relation-type"
                    }}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {edgeTypes()}
                  </Select>
                </FormControl>
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
