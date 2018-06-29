import React, { Component } from "react";
import "./ResourceSelectComponent.css";
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
import api from "../../services/api";

class ResourceSelectComponent extends Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    console.log(props.resources);
  }

  onChange(e) {
    this.props.onChange(e);
  }
  
  render() {
    const resources = this.props.resources.map(resource => {
      return this.props.children ? (
        this.props.children(resource)
      ) : (
        <MenuItem key={resource.name} value={resource["@rid"]}>
          {resource.name}
        </MenuItem>
      );
    });
    return (
      <FormControl className="type-select" style={{ width: "100%" }}>
        <InputLabel htmlFor="resource-select">{this.props.label}</InputLabel>
        <Select
          value={this.props.value}
          onChange={e => this.onChange(e)}
          inputProps={{
            name: this.props.name,
            id: "resource-select"
          }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {resources}
        </Select>
      </FormControl>
    );
  }
}
export default ResourceSelectComponent;
