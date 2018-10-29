/**
 * @module /views/DataView
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './DataView.css';
import * as jc from 'json-cycle';
import { Route, Redirect, Switch } from 'react-router-dom';
import {
  CircularProgress,
  Snackbar,
  Button,
  Typography,
} from '@material-ui/core';
import qs from 'qs';
import omit from 'lodash.omit';
import GraphComponent from '../../components/GraphComponent/GraphComponent';
import TableComponent from '../../components/TableComponent/TableComponent';
import DetailDrawer from '../../components/DetailDrawer/DetailDrawer';
import { withSchema } from '../../components/SchemaContext/SchemaContext';
import api from '../../services/api';
import classes from '../../models/classes';
import config from '../../static/config';

const { DEFAULT_NEIGHBORS } = config;
const DEFAULT_LIMIT = 1000;

/**
 * View for managing state of query results. Contains sub-routes for table view (/data/table)
 * and graph view (/data/graph) to display data. Redirects to /data/table for all other
 * sub-routes.
 *
 * Handles all api calls for its child components, including firing the passed in query
 * from the url search string, retrieving the database schema, and making subsequent
 * individual record GETs throughout the user's session.
 *
 */
class DataViewBase extends Component {
  /**
   * Makes API GET call to specified endpoint, with specified query parameters.
   * @param {string} route - API endpoint.
   * @param {Object} queryParams - Query parameters object.
   * @param {Array} omitted - List of parameters to strip from API call.
   */
  static async makeApiQuery(route, queryParams, omitted = []) {
    const response = await api.get(`${route}?${qs.stringify(omit(queryParams, omitted))}`);
    return Promise.resolve(jc.retrocycle(response).result);
  }

  constructor(props) {
    super(props);
    this.state = {
      data: null,
      displayed: [],
      hidden: [],
      allProps: [],
      storedFilters: [],
      detail: null,
      next: null,
      completedNext: true,
      filteredSearch: null,
      moreResults: false,
    };

    this.handleClick = this.handleClick.bind(this);
    this.processData = this.processData.bind(this);
    this.prepareNextPagination = this.prepareNextPagination.bind(this);

    // TableComponent methods
    this.handleCheckbox = this.handleCheckbox.bind(this);
    this.handleCheckAll = this.handleCheckAll.bind(this);
    this.handleHideSelected = this.handleHideSelected.bind(this);
    this.handleShowAllNodes = this.handleShowAllNodes.bind(this);
    this.handleSubsequentPagination = this.handleSubsequentPagination.bind(this);

    // GraphComponent methods
    this.handleDetailDrawerOpen = this.handleDetailDrawerOpen.bind(this);
    this.handleDetailDrawerClose = this.handleDetailDrawerClose.bind(this);
    this.handleNewColumns = this.handleNewColumns.bind(this);

    // NodeDetailComponent methods
    this.handleNodeEditStart = this.handleNodeEditStart.bind(this);

    // Routing methods
    this.handleGraphRedirect = this.handleGraphRedirect.bind(this);
    this.handleTableRedirect = this.handleTableRedirect.bind(this);
  }

  /**
   * Queries the api and loads results into component state.
   */
  async componentDidMount() {
    const { history, schema } = this.props;

    const filteredSearch = qs.parse(history.location.search.slice(1));
    let route = '/ontologies';
    const omitted = [];
    const kbClass = schema.getClass(filteredSearch['@class']);
    if (kbClass) {
      ({ route } = kbClass);
      omitted.push('@class');
    }
    filteredSearch.neighbors = filteredSearch.neighbors || DEFAULT_NEIGHBORS;
    filteredSearch.limit = filteredSearch.limit || DEFAULT_LIMIT;
    const data = await DataViewBase.makeApiQuery(route, filteredSearch, omitted);
    this.processData(data);
    this.prepareNextPagination(route, filteredSearch, data, omitted);
    this.setState({ filteredSearch });
  }

  /**
   * Processes ontology data and updates properties map.
   * @param {Array} queryResults - List of returned records.
   * @param {Object} schema - Knowledgebase db schema.
   */
  processData(queryResults) {
    let { allProps, data } = this.state;
    const { schema } = this.props;
    if (!data) {
      data = {};
    }
    if (!allProps || allProps.length === 0) {
      allProps = ['@rid', '@class'];
    }

    queryResults.forEach((record) => {
      allProps = schema.collectOntologyProps(record, allProps);
      data[record['@rid']] = schema.newRecord(record);
    });

    this.setState({ data, allProps });
  }

  /**
   * Prepares next query function.
   * @param {string} route - API route.
   * @param {Object} queryParams - Query parameters key/value pairs.
   * @param {Array} prevResult - Previous query results.
   * @param {Array} omitted - List of property keys to omit during next query.
   */
  prepareNextPagination(route, queryParams, prevResult, omitted = []) {
    const nextQueryParams = queryParams;
    if (prevResult.length >= queryParams.limit) {
      nextQueryParams.skip = Number(queryParams.limit) + Number(queryParams.skip || 0);
      this.setState({
        next: () => DataViewBase.makeApiQuery(route, nextQueryParams, omitted),
        moreResults: true,
        filteredSearch: nextQueryParams,
      });
    } else {
      this.setState({
        next: null,
        moreResults: false,
      });
    }
  }

  /**
   * Triggered function for when a node object is clicked in a child component.
   * Sets the state selected ID to clicked node.
   * @param {Object} node - Clicked node identifier.
   */
  async handleClick(node) {
    const { data } = this.state;
    const { schema } = this.props;
    if (!data[node.getId()]) {
      const { route } = schema.get(node.data['@class']);
      const endpoint = `${route || '/ontologies'}/${node.getId().slice(1)}?neighbors=${DEFAULT_NEIGHBORS}`; // change
      const response = await api.get(endpoint);
      this.processData([jc.retrocycle(response).result]);
    }
  }

  /**
   * Adds node identifier to list of displayed nodes.
   * @param {string} rid - Checked node identifier.
   */
  handleCheckbox(e, rid) {
    e.stopPropagation();
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
   * @param {Event} e - Checkbox event.
   */
  handleCheckAll(e, pageData) {
    let displayed;
    if (e.target.checked) {
      displayed = pageData.map(d => d['@rid']);
    } else {
      displayed = [];
    }
    this.setState({ displayed });
  }

  /**
   * Clears displayed array.
   */
  handleHideSelected() {
    const { displayed, hidden } = this.state;
    hidden.push(...displayed);
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
   * Handles subsequent pagination call
   */
  async handleSubsequentPagination() {
    const {
      next,
      data,
      filteredSearch,
    } = this.state;
    const { schema } = this.props;

    if (next) {
      try {
        this.setState({
          next: null,
          moreResults: false,
          completedNext: false,
        });

        let route = '/ontologies';
        const omitted = [];
        const kbClass = schema.getClass(filteredSearch['@class']);
        if (kbClass) {
          ({ route } = kbClass);
          omitted.push('@class');
        }

        const nextData = await next();

        this.processData(nextData);
        this.prepareNextPagination(route, filteredSearch, nextData, omitted);

        this.setState({
          data,
          completedNext: true,
        });
      } catch (e) {
        console.error(e);
      }
    }
    return next;
  }

  /**
   * Sets selected ID to input node identifier and opens edit drawer.
   */
  handleNodeEditStart() {
    const { detail } = this.state;
    const { history, schema } = this.props;
    if (detail) {
      let route;
      if (schema.isOntology(detail['@class'])) {
        route = 'ontology';
      } else if (detail['@class'] === 'PositionalVariant') {
        route = 'variant';
      } else if (detail['@class'] === 'Statement') {
        route = 'statement';
      }
      history.push(`/edit/${route}/${detail.getId().slice(1)}`);
    }
  }

  /**
   * Closes detail drawer.
   */
  handleDetailDrawerClose() {
    this.setState({ detail: null });
  }

  /**
   * Updates data and opens detail drawer for the specified node.
   * @param {Object} node - Specified node.
   * @param {boolean} open - flag to open drawer, or to just update.
   * @param {boolean} edge - flag to indicate edge record.
   */
  async handleDetailDrawerOpen(node, open, edge) {
    const { data, detail } = this.state;
    if (!open && !detail) return;
    if (edge) {
      this.setState({ detail: new classes.Edge(node.data), detailEdge: true });
    } else {
      if (!data[node.getId()]) {
        const response = await api.get(`/ontologies/${node.getId().slice(1)}?neighbors=${DEFAULT_NEIGHBORS}`);
        data[node.getId()] = jc.retrocycle(response).result;
      }
      this.setState({ detail: data[node.getId()], detailEdge: false });
    }
  }

  /**
   * Handles redirect to table to graph.
   */
  handleGraphRedirect(filters) {
    const { history } = this.props;
    this.setState({ storedFilters: filters, detail: null });
    history.push({ pathname: '/data/graph', search: history.location.search });
  }

  /**
   * Handles redirect to graph to table.
   */
  handleTableRedirect() {
    const { history } = this.props;
    this.setState({ detail: null });
    history.push({
      pathname: '/data/table',
      search: history.location.search,
    });
  }

  /**
   * Updates column list with field keys from new node.
   * @param {Object} node - newly added object.
   */
  handleNewColumns(node) {
    const { allProps } = this.state;
    const { schema } = this.props;
    this.setState({ allProps: schema.collectOntologyProps(node, allProps) });
  }

  render() {
    const {
      data,
      displayed,
      hidden,
      allProps,
      detail,
      moreResults,
      filteredSearch,
      detailEdge,
      completedNext,
      storedFilters,
    } = this.state;

    const {
      schema,
      history,
    } = this.props;

    if (!data) {
      return <CircularProgress color="secondary" size={100} id="progress-spinner" />;
    }
    const edges = schema.getEdges();
    const cls = filteredSearch && filteredSearch['@class'];
    const defaultOrders = schema.getClassConstructor(cls || 'Ontology').getIdentifiers();
    const detailDrawer = (
      <DetailDrawer
        node={detail}
        schema={schema}
        open={!!detail}
        onClose={this.handleDetailDrawerClose}
        isEdge={detailEdge}
        handleNodeEditStart={this.handleNodeEditStart}
        identifiers={defaultOrders}
      />
    );
    const GraphWithProps = () => (
      <GraphComponent
        data={data}
        handleClick={this.handleClick}
        displayed={displayed}
        handleDetailDrawerOpen={this.handleDetailDrawerOpen}
        handleDetailDrawerClose={this.handleDetailDrawerClose}
        handleTableRedirect={this.handleTableRedirect}
        edgeTypes={edges}
        detail={detail}
        allProps={allProps}
        localStorageKey={qs.stringify(filteredSearch)}
        handleNewColumns={this.handleNewColumns}
      />
    );
    const TableWithProps = () => (
      <TableComponent
        data={data}
        detail={detail}
        displayed={displayed}
        handleCheckAll={this.handleCheckAll}
        handleCheckbox={this.handleCheckbox}
        handleHideSelected={this.handleHideSelected}
        handleShowAllNodes={this.handleShowAllNodes}
        handleGraphRedirect={this.handleGraphRedirect}
        handleSubsequentPagination={this.handleSubsequentPagination}
        handleDetailDrawerOpen={this.handleDetailDrawerOpen}
        hidden={hidden}
        allProps={allProps}
        moreResults={moreResults}
        completedNext={completedNext}
        storedFilters={storedFilters}
        defaultOrder={defaultOrders}
      />
    );
    return (
      <div className="data-view">
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={Object.keys(data).length === 0}
          onClose={() => history.push('/query')}
          autoHideDuration={3000}
          message={(
            <span>
              No results found, redirecting...
            </span>
          )}
          action={(
            <Button color="secondary" onClick={() => history.push('/query')}>
              Ok
            </Button>
          )}
        />
        {Object.keys(data).length !== 0 && qs.stringify(filteredSearch) && edges
          ? (
            <Switch>
              <Route exact path="/data/table" render={TableWithProps} />
              <Route exact path="/data/graph" render={GraphWithProps} />
              <Route exact path="/data/*">
                {
                  <Redirect to={`/data/table${history.location.search}`} />
                }
              </Route>
            </Switch>
          ) : (
            <div className="no-results-msg">
              <Typography variant="h5">
                No Results
              </Typography>
            </div>
          )
        }
        {schema && detailDrawer}
      </div>);
  }
}

/**
 * @namespace
 * @property {Object} history - Application routing history object.
 * @property {Object} schema - Knowledgebase schema object.
 */
DataViewBase.propTypes = {
  history: PropTypes.object.isRequired,
  schema: PropTypes.object.isRequired,
};

const DataView = withSchema(DataViewBase);

export {
  DataView,
  DataViewBase,
};
