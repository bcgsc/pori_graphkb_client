import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './DataView.css';
import * as jc from 'json-cycle';
import { Route, Redirect } from 'react-router-dom';
import { Paper, Drawer, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import GraphComponent from '../../components/GraphComponent/GraphComponent';
import TableComponent from '../../components/TableComponent/TableComponent';
import NodeFormComponent from '../../components/NodeFormComponent/NodeFormComponent';
import api from '../../services/api';

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
    const dataMap = {};
    let { queryRedirect } = this.state;
    const { loginRedirect } = this.state;
    const { location } = this.props;
    const search = location.search ? `${location.search}&` : '?';

    api
      .get(`/diseases${search}neighbors=3`)
      .then((data) => {
        const cycled = jc.retrocycle(data.result);
        if (cycled.length === 0) queryRedirect = true;
        cycled.forEach((ontologyTerm) => {
          dataMap[ontologyTerm['@rid']] = ontologyTerm;
        });
        this.setState({
          data: dataMap,
          selectedId: Object.keys(dataMap)[0],
          queryRedirect,
          loginRedirect,
        });
      })
      .catch((error) => {
        if (error.status === 401) {
          this.setState({ loginRedirect: true });
        }
      });
  }

  handleNodeAdd(node) {
    const { data, displayed } = this.state;

    if (node.source.name && !data[node['@rid']]) {
      data[node['@rid']] = node;
      if (displayed.indexOf(node['@rid']) === -1) {
        displayed.push(node['@rid']);
      }
      this.setState({ data, displayed });
    }
  }

  handleClick(rid) {
    this.setState({ selectedId: rid });
  }

  handleCheckbox(rid) {
    const { displayed } = this.state;
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
    const { data } = this.state;
    if (e.target.checked) {
      displayed = Object.keys(data);
    } else {
      displayed = [];
    }
    this.setState({ displayed });
  }

  handleDrawerClose() {
    this.setState({ editing: false });
  }

  handleNodeEditStart(rid) {
    this.setState({ selectedId: rid, editing: true });
  }

  handleNodeDelete(rid) {
    const { data } = this.state;
    delete data[rid];
    this.setState({ data, editing: false });
  }

  handleNodeFinishEdit(node) {
    const { data } = this.state;
    api
      .get(`/${node['@class'].toLowerCase()}s/${node['@rid'].slice(1)}?neighbors=3`)
      .then((response) => {
        data[node['@rid']] = jc.retrocycle(response.result);
        this.setState({ data, editing: false });
      });
  }

  render() {
    const {
      editing,
      selectedId,
      data,
      displayed,
      queryRedirect,
      loginRedirect,
    } = this.state;

    const { location } = this.props;

    const editDrawer = (
      <Drawer
        variant="persistent"
        anchor="right"
        open={editing}
        classes={{
          paper: 'drawer-box-graph',
        }}
        onClose={this.handleDrawerClose}
        SlideProps={{ unmountOnExit: true }}
      >
        <Paper elevation={5} className="graph-wrapper">
          <div className="close-drawer-btn">
            <IconButton onClick={this.handleDrawerClose}>
              <CloseIcon color="action" />
            </IconButton>
          </div>
          <NodeFormComponent
            selectedId={selectedId}
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
        data={data}
        search={location.search}
        handleClick={this.handleClick}
        displayed={displayed}
        selectedId={selectedId}
        handleNodeEditStart={() => this.handleNodeEditStart(selectedId)}
      />
    );
    const TableWithProps = () => (
      <TableComponent
        data={data}
        selectedId={selectedId}
        handleClick={this.handleClick}
        handleCheckbox={this.handleCheckbox}
        search={location.search}
        displayed={displayed}
        handleCheckAll={this.handleCheckAll}
        handleNodeEditStart={this.handleNodeEditStart}
      />
    );
    const dataView = () => {
      if (queryRedirect) {
        return <Redirect push to={{ pathname: '/query' }} />;
      }
      if (loginRedirect) {
        return <Redirect push to={{ pathname: '/login' }} />;
      }

      if (data) {
        return (
          <div className="data-view">
            <Route exact path="/data/table" render={TableWithProps} />
            <Route exact path="/data/graph" render={GraphWithProps} />
            {editDrawer}
          </div>
        );
      }
      return null;
    };

    return dataView();
  }
}

DataView.propTypes = {
  location: PropTypes.object.isRequired,
};

export default DataView;
