import React, { Component } from "react";
import "./DataHubComponent.css";
import api from "../../services/api";
import prepareEntry from "../../services/serializers";
import NodeDetail from "../NodeDetail/NodeDetail";
import TableComponent from "../TableComponent/TableComponent";
import { Redirect } from "react-router-dom";
import { Paper } from "@material-ui/core";
import GraphComponent from "../GraphComponent/GraphComponent";
import { Link, Route } from "react-router-dom";

class DataHubComponent extends Component {
  constructor(props) {
    super(props);

    const url = props.location.pathname.split("/");

    this.state = {
      redirect: false,
      data: null,
      displayed: [],
      selectedId: null
    };

    this.handleClick = this.handleClick.bind(this);
    this.handleNodeAdd = this.handleNodeAdd.bind(this);
  }

  componentDidMount() {
    let dataMap = {};
    let redirect = false;
    api.get("/diseases" + this.props.location.search).then(data => {
      if (data.length === 0) redirect = true;
      data.forEach(ontologyTerm => {
        let entry = prepareEntry(ontologyTerm);
        dataMap[ontologyTerm["@rid"]] = ontologyTerm;
      });
      this.setState({
        data: dataMap,
        selectedId: Object.keys(dataMap)[0],
        redirect: redirect
      });
    });
  }

  handleNodeAdd(node) {
    const data = this.state.data;
    data[node["@rid"]] = node;
    this.setState({ data });
  }

  handleClick(e, rid) {
    this.setState({ selectedId: rid });
  }

  render() {
    const GraphWithProps = () => (
      <GraphComponent
        handleNodeAdd={this.handleNodeAdd}
        data={this.state.data}
        search={this.props.location.search}
      />
    );
    const TableWithProps = () => (
      <TableComponent
        data={this.state.data}
        selectedId={this.state.selectedId}
        handleClick={this.handleClick}
        handleCheckbox={this.handleCheckbox}
        search={this.props.location.search}
      />
    );
    let dataView = () => {
      if (this.state.redirect)
        return <Redirect push to={{ pathname: "/query" }} />;

      if (this.state.data) {
        return (
          <div className="data-view">
            <Route exact path="/data/table" render={TableWithProps} />
            <Route exact path="/data/graph" render={GraphWithProps} />
          </div>
        );
      } else return null;
    };

    return dataView();
  }
}

export default DataHubComponent;
