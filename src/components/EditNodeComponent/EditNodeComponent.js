import React, { Component } from "react";
import ReactDOM from "react-dom";
import "./EditNodeComponent.css";
import TextField from "@material-ui/core/TextField";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import AddIcon from "@material-ui/icons/Add";
import CloseIcon from "@material-ui/icons/Close";
import IconButton from "@material-ui/core/IconButton";
import FolderIcon from "@material-ui/icons/Folder";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import Button from "@material-ui/core/Button";
import AutoSearchComponent from "../AutoSearchComponent/AutoSearchComponent";
import api from "../../services/api";

class EditNodeComponent extends Component {
  constructor(props) {
    super(props);
    this.state = props.location.state;
    console.log(this.state)
  }

  render() {
    return (
      <form className="wrapper" onSubmit={this.handleSubmit}>
        <div className="basic-params">
          <h2 className="section-header">Basic Parameters</h2>
          <div className="input-wrapper">
            <AutoSearchComponent
              value={this.state.newSourceName}
              onChange={this.handleSourceChange}
              endpoint="sources"
              placeholder="eg. disease ontology"
              name="source"
              required={true}
              label="Source"
            />
          </div>
          <div className="input-wrapper">
            <TextField
              id="sourceId"
              placeholder="eg. NCIT:1032"
              label="Source ID"
              value={this.state.sourceId}
              onChange={this.handleMainPayloadChange}
              className="text-input"
              name="sourceId"
              required
            />
          </div>
          <div className="input-wrapper">
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
          </div>
          <div className="input-wrapper">
            <TextField
              id="longName"
              label="Long Name"
              value={this.state.longName}
              onChange={this.handleMainPayloadChange}
              className="text-input"
              name="longName"
              multiline
            />
          </div>
          <div className="input-wrapper">
            <TextField
              id="description"
              label="Description"
              value={this.state.description}
              onChange={this.handleMainPayloadChange}
              className="text-input"
              name="description"
              multiline
            />
          </div>
          <div className="input-wrapper">
            <TextField
              id="sourceIdVersion"
              label="Source ID Version"
              value={this.state.sourceIdVersion}
              onChange={this.handleMainPayloadChange}
              className="text-input"
              name="sourceIdVersion"
            />
          </div>
        </div>
        {/* <div className="subsets-selection">
          <h2 className="section-header">Subsets</h2>
          <List className="list">{this.state.subsets}</List>
          <div className="input-wrapper">
            <TextField
              id="subset-temp"
              label="Add a Subset"
              value={this.state.subset}
              onChange={this.handleChange}
              className="text-input"
              name="subset"
              onKeyDown={e => {
                if (e.keyCode === 13) {
                  this.addSubset(e);
                }
              }}
            />
            <IconButton color="primary" onClick={this.addSubset}>
              <AddIcon />
            </IconButton>
          </div>
        </div> */}
        {/* <div className="relationships-selection">
          <h2 className="section-header">Relationships</h2>
          <List className="list">{this.state.relationships}</List>
          <div
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
          </div>
        </div> */}
        <div className="submit-button">
          <Button type="submit" variant="outlined">
            Add Node
          </Button>
        </div>
      </form>
    );
  }
}
export default EditNodeComponent;
