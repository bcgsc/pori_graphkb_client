import React, { Component } from "react";
import "./DataView.css";
import api from "../../services/api";
import { Route, Redirect } from "react-router-dom";
import { Paper } from "@material-ui/core";
import GraphComponent from "../../components/GraphComponent/GraphComponent";
import TableComponent from "../../components/TableComponent/TableComponent";

class DataView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      redirect: false,
      data: null,
      displayed: [],
      selectedId: null
    };

    this.handleClick = this.handleClick.bind(this);
    this.handleNodeAdd = this.handleNodeAdd.bind(this);
    this.handleCheckbox = this.handleCheckbox.bind(this);
  }

  componentDidMount() {
    let dataMap = {};
    let redirect = false;
    api.get("/diseases" + this.props.location.search).then(data => {
      if (data.length === 0) redirect = true;
      data.forEach(ontologyTerm => {
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
    const { data, displayed } = this.state;
    data[node["@rid"]] = node;
    this.setState({ data });
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
    this.setState({ displayed }, console.log(this.state.displayed));
  }

  render() {
    const GraphWithProps = () => (
      <GraphComponent
        handleNodeAdd={this.handleNodeAdd}
        data={this.state.data}
        search={this.props.location.search}
        handleClick={this.handleClick}
        displayed={this.state.displayed}
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

export default DataView;
