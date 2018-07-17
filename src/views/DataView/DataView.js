import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './DataView.css';
import * as jc from 'json-cycle';
import { Route, Redirect } from 'react-router-dom';
import {
  CircularProgress,
} from '@material-ui/core';
import queryString from 'query-string';
import GraphComponent from '../../components/GraphComponent/GraphComponent';
import TableComponent from '../../components/TableComponent/TableComponent';
import api from '../../services/api';
import util from '../../services/util';
/**
 * State handling component for query results.
 */
class DataView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      queryRedirect: false,
      loginRedirect: false,
      data: null,
      displayed: [],
      hidden: [],
      selectedId: null,
      editing: false,
      error: null,
      allColumns: [],
    };

    this.handleClick = this.handleClick.bind(this);
    this.handleCheckbox = this.handleCheckbox.bind(this);
    this.handleCheckAll = this.handleCheckAll.bind(this);
    this.handleHideSelected = this.handleHideSelected.bind(this);
    this.handleShowAllNodes = this.handleShowAllNodes.bind(this);
    this.handleDrawerClose = this.handleDrawerClose.bind(this);
    this.handleNodeEditStart = this.handleNodeEditStart.bind(this);
  }

  /**
   * Queries the api and loads results into component state.
   */
  async componentDidMount() {
    const dataMap = {};
    let { queryRedirect } = this.state;
    const { loginRedirect } = this.state;
    const { location } = this.props;

    const filteredSearch = queryString.parse(location.search);
    const endpoint = util.pluralize(filteredSearch.class || 'disease').toLowerCase();
    const endpointProps = await api.getEditableProps(filteredSearch.class || 'Disease');
    delete filteredSearch.class;
    const search = location.search ? `${queryString.stringify(filteredSearch)}&` : '';
    const V = await api.getVertexBaseClass();
    const allColumns = ['@rid'];

    api.get(`/${endpoint}/?${search}neighbors=3`)
      .then((data) => {
        const cycled = jc.retrocycle(data.result);

        if (cycled.length === 0) queryRedirect = true;
        cycled.forEach((ontologyTerm) => {
          Object.keys(ontologyTerm).forEach((prop) => {
            if (!V.properties[prop] && !allColumns.includes(prop)) {
              const endpointProp = endpointProps.find(p => p.name === prop);
              if (endpointProp && endpointProp.type === 'link') {
                Object.keys(ontologyTerm[prop]).forEach((nestedProp) => {
                  if (
                    !V.properties[nestedProp]
                    && !allColumns.includes(`${prop}.${nestedProp}`)
                    && !nestedProp.startsWith('in_')
                    && !nestedProp.startsWith('out_')
                    && !(endpointProp.linkedClass && nestedProp === '@class')
                  ) {
                    allColumns.push(`${prop}.${nestedProp}`);
                  }
                });
              } else {
                allColumns.push(prop);
              }
            }
          });
          dataMap[ontologyTerm['@rid']] = ontologyTerm;
        });
        this.setState({
          data: dataMap,
          selectedId: Object.keys(dataMap)[0],
          queryRedirect,
          loginRedirect,
          allColumns,
        });
      })
      .catch((error) => {
        if (error.status === 401) {
          this.setState({ loginRedirect: true });
        } else {
          this.setState({ error });
        }
      });
  }

  /**
   * Triggered function for when a node object is clicked in a child component.
   * Sets the state selected ID to clicked node.
   * @param {string} rid - Clicked node identifier.
   * @param {string} nodeClass - Class of clicked node.
   */
  async handleClick(rid, nodeClass) {
    const { data } = this.state;

    if (!data[rid] && nodeClass) {
      const endpoint = `/${util.pluralize(nodeClass)}/${rid.slice(1)}?neighbors=3`;
      const json = await api.get(endpoint);
      data[rid] = jc.retrocycle(json.result);
    }
    this.setState({ selectedId: rid, data });
  }

  /**
   * Adds node identifier to list of displayed nodes.
   * @param {string} rid - Checked node identifier.
   */
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

  /**
   * Adds all data entries to the list of displayed nodes.
   * @param {Evemt} e - Checkbox event.
   */
  handleCheckAll(e) {
    let displayed;
    const { data, hidden } = this.state;
    if (e.target.checked) {
      displayed = Object.keys(data).filter(key => !hidden.includes(key));
    } else {
      displayed = [];
    }
    this.setState({ displayed });
  }

  /**
   * Clears displayed array.
   */
  handleHideSelected() {
    const { displayed, hidden, selectedId } = this.state;
    hidden.push(...displayed);

    if (displayed.includes(selectedId)) this.setState({ selectedId: null });

    this.setState({ hidden, displayed: [] });
  }

  /**
   * Appends the input array to the displayed array.
   */
  handleShowAllNodes() {
    const { displayed, hidden } = this.state;

    displayed.push(...hidden);
    this.setState({ displayed, hidden: [] });
  }

  /**
   * Closes node edit drawer.
   */
  handleDrawerClose() {
    this.setState({ editing: false });
  }

  /**
   * Sets selected ID to input node identifier and opens edit drawer.
   * @param {string} rid - Target node rid.
   */
  handleNodeEditStart(rid) {
    this.setState({ selectedId: rid, editing: true });
  }

  render() {
    const {
      editing,
      selectedId,
      data,
      displayed,
      queryRedirect,
      loginRedirect,
      error,
      hidden,
      allColumns,
    } = this.state;


    const { location } = this.props;
    const selectedNode = data ? data[selectedId] : null;
    if (editing && selectedNode) {
      return <Redirect push to={{ pathname: `/edit/${selectedNode['@rid'].slice(1)}`, state: { node: selectedNode, query: location.search } }} />;
    }

    const GraphWithProps = () => (
      <GraphComponent
        data={data}
        search={location.search}
        handleClick={this.handleClick}
        displayed={displayed}
        selectedId={selectedId}
        handleNodeEditStart={this.handleNodeEditStart}
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
        hidden={hidden}
        allColumns={allColumns}
        handleCheckAll={this.handleCheckAll}
        handleNodeEditStart={this.handleNodeEditStart}
        handleHideSelected={this.handleHideSelected}
        handleShowAllNodes={this.handleShowAllNodes}
      />
    );
    const dataView = () => {
      if (loginRedirect) {
        return <Redirect push to={{ pathname: '/login' }} />;
      }
      if (queryRedirect) {
        return <Redirect push to={{ pathname: '/query', state: { noResults: true } }} />;
      }
      if (error) {
        return <Redirect push to={{ pathname: '/error', state: error }} />;
      }

      if (data) {
        return (
          <div className="data-view">
            <Route exact path="/data/table" render={TableWithProps} />
            <Route exact path="/data/graph" render={GraphWithProps} />
          </div>
        );
      }
      return <CircularProgress color="secondary" size={100} id="progress-spinner" />;
    };

    return dataView();
  }
}

/**
 * @param {Object} location - location property for the route and passed state.
 */
DataView.propTypes = {
  location: PropTypes.object.isRequired,
};

export default DataView;
