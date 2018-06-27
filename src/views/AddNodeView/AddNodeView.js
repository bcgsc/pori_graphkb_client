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
import EditNodeView from "../EditNodeView/EditNodeView";
import Api from "../../services/api";

class AddNodeView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      api: new Api(),
      nodeRid: null,
      open: true,
      source: "",
      sourceId: ""
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }
  handleClose(e) {
    this.setState({ open: false });
  }
  handleSubmit(e) {
    console.log("hiya");
  }

  render() {
    const editWithProps = () => {
      return this.state.nodeRid ? (
        <EditNodeView node={{ "@rid": this.state.nodeRid }} />
      ) : null;
    };
    const redirect = () => {
      return !this.state.nodeRid && !this.state.open  ? (
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
        {editWithProps()}
        {redirect()}
        <Dialog open={this.state.open} onClose={this.handleClose}>
          <DialogTitle>Please Specify a Source and Source ID</DialogTitle>
          <DialogContent>
            <DialogContentText>
              To add an ontology term, you must choose a source and source ID.
            </DialogContentText>
            <TextField
              name="source"
              fullWidth
              value={this.state.source}
              onChange={this.handleChange}
              label="Source"
              autoFocus
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
