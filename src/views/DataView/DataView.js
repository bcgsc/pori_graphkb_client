import React, { Component } from "react";
import { Route, Redirect } from "react-router-dom";
import "./DataView.css";
import { Paper, Drawer, Button, IconButton } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import * as jc from "json-cycle";
import GraphComponent from "../../components/GraphComponent/GraphComponent";
import TableComponent from "../../components/TableComponent/TableComponent";
import NodeFormComponent from "../../components/NodeFormComponent/NodeFormComponent";
import api from "../../services/api";

class DataView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      queryRedirect: false,
      loginRedirect: false,
      data: null,
      displayed: [],
      selectedId: null,
      editing: false,
      loginRedirect: false
    };

    this.handleClick = this.handleClick.bind(this);
    this.handleNodeAdd = this.handleNodeAdd.bind(this);
    this.handleCheckbox = this.handleCheckbox.bind(this);
    this.handleCheckAll = this.handleCheckAll.bind(this);
    this.handleDrawerClose = this.handleDrawerClose.bind(this);
    this.handleNodeEditStart = this.handleNodeEditStart.bind(this);
    this.handleNodeFinishEdit = this.handleNodeFinishEdit.bind(this);
    this.handleNodeDelete = this.handleNodeDelete.bind(this);
  }

  componentDidMount() {
    let dataMap = {};
    let queryRedirect = this.state.queryRedirect;
    let loginRedirect = this.state.loginRedirect;
    api
      .get("/diseases" + this.props.location.search)
      .then(data => {
        data = jc.retrocycle(data.result);
        if (data.length === 0) queryRedirect = true;
        data.forEach(ontologyTerm => {
          dataMap[ontologyTerm["@rid"]] = ontologyTerm;
        });
        this.setState({
          data: dataMap,
          selectedId: Object.keys(dataMap)[0],
          queryRedirect,
          loginRedirect
        });
      })
      .catch(error => {
        if (error.status === 401) {
          this.setState({ loginRedirect: true });
        } else if (error.status === 400) {
          this.setState({ queryRedirect: true });
        }
      });
  }

  handleNodeAdd(node) {
    if (node.source.name) {
      const { data, displayed } = this.state;
      data[node["@rid"]] = node;
      if (displayed.indexOf(node["@rid"]) === -1) {
        displayed.push(node["@rid"]);
      }
      this.setState({ data, displayed });
    }
  }
  handleClick(rid) {
    this.setState({ selectedId: rid });
  }
  handleCheckbox(rid) {
    const displayed = this.state.displayed;
    const i = displayed.indexOf(rid);
    if (i === -1) {
      displayed.push(rid);
    } else {
      displayed.splice(i, 1);
    }
    this.setState({ displayed });
  }
  handleCheckAll(e) {
    let displayed;
    if (e.target.checked) {
      displayed = Object.keys(this.state.data);
    } else {
      displayed = [];
    }
    this.setState({ displayed });
  }
  handleDrawerClose(e) {
    this.setState({ editing: false });
  }
  handleNodeEditStart(rid) {
    this.setState({ selectedId: rid, editing: true });
  }
  handleNodeDelete(rid) {
    const data = this.state.data;
    delete data[rid];
    this.setState({ data, editing: false });
  }
  handleNodeFinishEdit(node) {
    const data = this.state.data;
    api
      .get(
        "/" +
          node["@class"].toLowerCase() +
          "s/" +
          node["@rid"].slice(1) +
          "?neighbors=3"
      )
      .then(response => {
        data[node["@rid"]] = jc.retrocycle(response.result);
        this.setState({ data, editing: false });
      });
  }

  render() {
    const editDrawer = (
      <Drawer
        variant="persistent"
        anchor="right"
        open={this.state.editing}
        classes={{
          paper: "drawer-box-graph"
        }}
        onClose={this.handleDrawerClose}
        SlideProps={{ unmountOnExit: true }}
      >
        <Paper elevation={5} className="graph-wrapper">
          <div className="close-drawer-btn">
            <IconButton onClick={this.handleDrawerClose}>
              <CloseIcon color="error" />
            </IconButton>
          </div>
          <NodeFormComponent
            selectedId={this.state.selectedId}
            variant="edit"
            handleNodeFinishEdit={this.handleNodeFinishEdit}
            handleNodeDelete={this.handleNodeDelete}
          />
        </Paper>
      </Drawer>
    );

    const GraphWithProps = () => (
      <GraphComponent
        handleNodeAdd={this.handleNodeAdd}
        data={this.state.data}
        search={this.props.location.search}
        handleClick={this.handleClick}
        displayed={this.state.displayed}
        selectedId={this.state.selectedId}
        handleNodeEditStart={() =>
          this.handleNodeEditStart(this.state.selectedId)
        }
      />
    );
    const TableWithProps = () => (
      <TableComponent
        data={this.state.data}
        selectedId={this.state.selectedId}
        handleClick={this.handleClick}
        handleCheckbox={this.handleCheckbox}
        search={this.props.location.search}
        displayed={this.state.displayed}
        handleCheckAll={this.handleCheckAll}
        handleNodeEditStart={this.handleNodeEditStart}
      />
    );
    let dataView = () => {
      if (this.state.queryRedirect)
        return <Redirect push to={{ pathname: "/query" }} />;
      if (this.state.loginRedirect)
        return <Redirect push to={{ pathname: "/login" }} />;

      if (this.state.data) {
        return (
          <div className="data-view">
            {editDrawer}
            <Route exact path="/data/table" render={TableWithProps} />
            <Route exact path="/data/graph" render={GraphWithProps} />
          </div>
        );
      } else return null;
    };

    return dataView();
  }
}

export default DataView;
