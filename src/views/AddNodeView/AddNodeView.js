import React, { Component } from "react";
import "./AddNodeView.css";
import { Redirect } from "react-router-dom";
import {
  Divider,
  Menu,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import CloseIcon from "@material-ui/icons/Close";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import FolderIcon from "@material-ui/icons/Folder";
import AutoSearchComponent from "../../components/AutoSearchComponent/AutoSearchComponent";
import NodeFormComponent from "../../components/NodeFormComponent/NodeFormComponent";
import api from "../../services/api";

class AddNodeView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      nodeRid: null,
      open: true,
      source: "",
      sourceId: "",
      sourceRid: ""
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleAutoSearch = this.handleAutoSearch.bind(this);
  }

  handleAutoSearch(e) {
    this.setState({
      [e.target.name]: e.target.value,
      sourceRid: e.target["@rid"]
    });
  }
  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }
  handleClose(e) {
    this.setState({ open: false });
  }
  handleSubmit(e) {
    const { source, sourceId, sourceRid } = this.state;

    if (sourceRid && sourceId) {
      // api
      //   .post("/diseases", { sourceId: sourceId, source: sourceRid })
      //   .then(response => {
      //     console.log(response);
      //     response = response.result;
      //     this.setState({ nodeRid: response["@rid"], open: false });
      //   });
    }
  }

  render() {
    const redirect = () => {
      return !this.state.nodeRid && !this.state.open ? (
        <Redirect
          push
          to={{
            pathname: "/query"
          }}
        />
      ) : null;
    };

    return (
      <div className="wrapper">
         <NodeFormComponent variant="add" />
        <Dialog open={this.state.open} onClose={this.handleClose}>
          <DialogTitle>Please Specify a Source and Source ID</DialogTitle>
          <DialogContent>
            <DialogContentText>
              To add an ontology term, you must first define a source and source
              ID.
            </DialogContentText>
            <AutoSearchComponent
              value={this.state.source}
              onChange={this.handleAutoSearch}
              endpoint="sources"
              placeholder="eg. NCIT, Disease Ontology"
              name="source"
              label="Source"
            />

            <TextField
              name="sourceId"
              fullWidth
              value={this.state.sourceId}
              onChange={this.handleChange}
              label="Source ID"
            />
            <Button onClick={this.handleSubmit} color="primary">
              Submit
            </Button>
            <Button onClick={this.handleClose} color="primary">
              Cancel
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
}

export default AddNodeView;
