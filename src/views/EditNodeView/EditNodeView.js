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
  Button
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import CloseIcon from "@material-ui/icons/Close";
import FolderIcon from "@material-ui/icons/Folder";
import AutoSearchComponent from "../../components/AutoSearchComponent/AutoSearchComponent";
import api from "../../services/api";

class EditNodeView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      subset: "",
      relationship: {
        type: "",
        in: "",
        out: "",
        targetName: "",
        targetRid: ""
      },
      relationships: [],
      subsets: {}
    };
    console.log(this.state);
    console.log(props.location.pathname.split("/")[2]);
  }

  componentDidMount() {
    const edgeTypes = [
      "in_SubClassOf",
      "out_SubClassOf",
      "in_AliasOf",
      "out_AliasOf"
    ];
    api
      .get(
        "/diseases/" +
          this.props.location.pathname.split("/")[2] +
          "?neighbors=2"
      )
      .then(response => {
        console.log(response);
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

  render() {
    const subsets = Object.keys(this.state.subsets).map(subset => {
      return (
        <ListItem key={subset}>
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText primary={subset} />
          <IconButton
            onClick={e => {
              this.deleteSubset(e, subset);
            }}
          >
            <CloseIcon />
          </IconButton>
        </ListItem>
      );
    });
    const relationships = this.state.relationships.map(relationship => {
      return (
        <ListItem key={relationship}>
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText
            primary={relationship.type + ": " + relationship.targetName}
          />
          <IconButton
            color="secondary"
            onClick={e => {
              this.deleteRelationship(e, relationship);
            }}
          >
            <CloseIcon />
          </IconButton>
        </ListItem>
      );
    });

    return (
      <form className="wrapper" onSubmit={this.handleSubmit}>
        <div className="basic-params">
          <h2 className="section-header">Edit Term Parameters</h2>
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
                multiline
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
        <div className="subsets-selection">
          <h2 className="section-header">Subsets</h2>
          <List className="list">{subsets}</List>
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
                  alert("hi");
                }
              }}
            />
            <IconButton color="primary" onClick={this.addSubset}>
              <AddIcon />
            </IconButton>
          </ListItem>
        </div>
        <div className="relationships-selection">
          <h2 className="section-header">Relationships</h2>
          <List className="list">{relationships}</List>
          <ListItem
            className="input-wrapper"
            onKeyDown={e => {
              if (e.keyCode === 13) this.addRelationship(e);
            }}
          >
            <FormControl>
              <InputLabel htmlFor="relation-type">Type</InputLabel>
              <Select
                value={this.state.relationship.type}
                onChange={e => {
                  this.handleRelationship(e.target.value, "type");
                }}
                className="type-select"
                inputProps={{
                  name: "relationship-type",
                  id: "relation-type"
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value={"subclassof"}>Parent</MenuItem>
                <MenuItem value={"subclassof"}>Child</MenuItem>
                <MenuItem value={"aliasof"}>Alias</MenuItem>
              </Select>
            </FormControl>

            <div className="search-wrap">
              <AutoSearchComponent
                value={this.state.relationship.targetName}
                onChange={e => {
                  this.handleRelationship(e.target.value, "targetName");
                  this.handleRelationship(e.target.rid, "targetRid");
                }}
                placeholder="Target Name"
                limit={10}
              />
            </div>
            <IconButton color="primary" onClick={this.addRelationship}>
              <AddIcon />
            </IconButton>
          </ListItem>
        </div>
        <div className="submit-button">
          <Button type="submit" variant="outlined">
            Confirm Changes
          </Button>
        </div>
      </form>
    );
  }
}
export default EditNodeView;
