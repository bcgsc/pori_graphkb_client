import React, { Component } from "react";
import "./AddNodeView.css";
import {
  Divider,
  Paper,
  Menu,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Button,
  IconButton
} from "@material-ui/core";
import {
  AddIcon,
  CloseIcon,
  KeyboardArrowDownIcon,
  FolderIcon
} from "@material-ui/icons/Add";
import AutoSearchComponent from "../../components/AutoSearchComponent/AutoSearchComponent";
import api from "../../services/api";

class AddNodeView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      redirect: false,
      id: null,
      subset: "",
      relationship: {
        type: "",
        in: "",
        out: "",
        targetName: "",
        targetRid: ""
      },
      relationships: [],
      mainPayload: {
        source: "",
        sourceId: "",
        name: "",
        longName: "",
        description: "",
        sourceIdVersion: "",
        subsets: []
      },
      newSourceName: "",
      menu: "",
      anchorEl: null
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSourceChange = this.handleSourceChange.bind(this);
    this.handleMainPayloadChange = this.handleMainPayloadChange.bind(this);
    this.handleRelationship = this.handleRelationship.bind(this);
    this.addSubset = this.addSubset.bind(this);
    this.addRelationship = this.addRelationship.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.mainPost = this.mainPost.bind(this);
    this.handleMenu = this.handleMenu.bind(this);
  }

  addSubset(e) {
    if (this.state.subset.trim()) {
      const subsets = this.state.mainPayload.subsets;
      subsets[this.state.subset] = this.state.subset;
      this.setState({
        subsets: subsets,
        subset: ""
      });
    }
    e.preventDefault();
  }

  deleteSubset(e, subset) {
    const i = this.state.mainPayload.subsets.indexOf(subset);
    this.state.mainPayload.subsets.splice(i);
    this.setState({ subsets: this.state.mainPayload.subsets });
  }
  mainPost(source) {
    const payload = this.state.mainPayload;
    payload.source = source;
    api.post("/diseases", payload).then(response => {
      const id = response["@rid"];
      this.state.relationships.forEach(edge => {
        if (!edge.in) edge.in = id;
        if (!edge.out) edge.out = id;

        edge.type =
          edge.type.toLowerCase() === "alias" ? "aliasof" : "subclassof";
        api
          .post("/" + edge.type, {
            in: edge.in,
            out: edge.out,
            source: source
          })
          .catch(error => console.error(error));
      });
      this.setState({ id, redirect: true });
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!this.state.mainPayload.source) {
      api
        .post("/sources", { name: this.state.newSourceName })
        .then(response => {
          this.mainPost(response["@rid"]);
        });
    } else {
      this.mainPost(this.state.mainPayload.source);
    }
  }

  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleSourceChange(e) {
    const mainPayload = this.state.mainPayload;
    mainPayload.source = e.target.rid;
    this.setState({ mainPayload, newSourceName: e.target.value });
  }

  handleMainPayloadChange(e) {
    const mainPayload = this.state.mainPayload;
    mainPayload[e.target.name] = e.target.value;
    this.setState({ mainPayload });
  }

  handleRelationship(value, key) {
    const relationship = this.state.relationship;
    relationship[key] = value;
    this.setState({ relationship });
  }

  //Also get the rids
  addRelationship(e) {
    if (
      this.state.relationship.targetName.trim() &&
      this.state.relationship.targetRid &&
      this.state.relationship.type
    ) {
      const relationships = this.state.relationships;
      relationships.push(this.state.relationship);
      this.setState({
        relationships: relationships,
        relationship: {
          type: "",
          in: "",
          out: "",
          targetName: ""
        }
      });
    }
    e.preventDefault();
  }

  deleteRelationship(e, relationship) {
    const i = this.state.relationships.findIndex(r => relationship === r);
    delete this.state.relationships[i];
    this.setState({ relationships: this.state.relationships });
  }

  handleMenu(e, id, setState) {
    this.setState({ anchorEl: e.currentTarget, menu: id });
    setState({ isOpen: true });
  }

  render() {
    const subsets = Object.keys(this.state.mainPayload.subsets).map(subset => {
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

    const relationshipDisplay = (
      item,
      getItemProps,
      setState,
      index,
      getInputProps
    ) => {
      return (
        <div
          {...getItemProps({
            key: item["@rid"],
            item,
            index
          })}
          className="relationship-item"
          {...getInputProps({
            onClick: e => {
              e.nativeEvent.preventDownshiftDefault = true;
            }
          })}
        >
          <div
            className="detail"
            {...getInputProps({
              onClick: e => {
                e.nativeEvent.preventDownshiftDefault = true;
                setState({ selectedItem: item, isOpen: false });
              }
            })}
          >
            <Typography variant="subheading">
              {item.name + " : " + item.sourceId}
            </Typography>
            <Divider />
            <Typography variant="caption">{item.source.name}</Typography>
          </div>
          <IconButton
            onClick={e => {
              this.handleMenu(e, item["@rid"], setState);
            }}
          >
            <KeyboardArrowDownIcon />
          </IconButton>
          <Menu open={!!this.state.menu} anchorEl={this.state.anchorEl}>
            <MenuItem onClick={this.handleClose}>BLARGH</MenuItem>
          </Menu>
        </div>
      );
    };
    return (
      <form className="wrapper" onSubmit={this.handleSubmit}>
        <div className="basic-params">
          <h2 className="section-header">Basic Parameters</h2>
          <List>
            <ListItem className="input-wrapper">
              <AutoSearchComponent
                value={this.state.newSourceName}
                onChange={this.handleSourceChange}
                endpoint="sources"
                placeholder="eg. disease ontology"
                name="source"
                required={true}
                label="Source"
              />
            </ListItem>
            <ListItem className="input-wrapper">
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
          <List className="list">
            {subsets}
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
                    this.addSubset(e);
                  }
                }}
              />
              <IconButton color="primary" onClick={this.addSubset}>
                <AddIcon />
              </IconButton>
            </ListItem>
          </List>
        </div>
        <div className="relationships-selection">
          <h2 className="section-header">Relationships</h2>
          <List className="list">
            {relationships}
            <div
              className="input-wrapper"
              onKeyDown={e => {
                if (e.keyCode === 13) this.addRelationship(e);
              }}
            >
              {/* TODO: controlled edge types */}
              {/* <FormControl>
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
                  <MenuItem value={"Parent"}>Parent</MenuItem>
                  <MenuItem value={"Child"}>Child</MenuItem>
                  <MenuItem value={"Alias"}>Alias</MenuItem>
                </Select>
              </FormControl> */}

              <div className="search-wrap">
                <AutoSearchComponent
                  value={this.state.relationship.targetName}
                  onChange={e => {
                    this.handleRelationship(e.target.value, "targetName");
                    this.handleRelationship(e.target.rid, "targetRid");
                  }}
                  placeholder="Target Name"
                  limit={10}
                >
                  {relationshipDisplay}
                </AutoSearchComponent>
              </div>
              <IconButton color="primary" onClick={this.addRelationship}>
                <AddIcon />
              </IconButton>
            </div>
          </List>
        </div>
        <div className="submit-button">
          <Button type="submit" variant="outlined">
            Add Node
          </Button>
        </div>
      </form>
    );
  }
}

export default AddNodeView;
