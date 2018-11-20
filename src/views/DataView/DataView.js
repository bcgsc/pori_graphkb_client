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
import SCHEMA_DEFN from '../../schema/src/schema';
import GraphComponent from '../../components/GraphComponent/GraphComponent';
import TableComponent from '../../components/TableComponent/TableComponent';
import DetailDrawer from '../../components/DetailDrawer/DetailDrawer';
import { withKB } from '../../components/KBContext/KBContext';
import api from '../../services/api';
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
    return jc.retrocycle(response).result;
  }

  /**
   * Prepares next query function.
   * @param {string} route - API route.
   * @param {Object} queryParams - Query parameters key/value pairs.
   * @param {Array} prevResult - Previous query results.
   * @param {Array} omitted - List of property keys to omit during next query.
   */
  static prepareNextPagination(route, queryParams, prevResult, omitted = []) {
    const nextQueryParams = queryParams;
    if (prevResult.length >= queryParams.limit) {
      nextQueryParams.skip = Number(queryParams.limit) + Number(queryParams.skip || 0);
      return {
        next: () => DataViewBase.makeApiQuery(route, nextQueryParams, omitted),
        moreResults: true,
        filteredSearch: nextQueryParams,
      };
    }
    return {
      next: null,
      moreResults: false,
    };
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
    console.log(SCHEMA_DEFN);
  }

  /**
   * Queries the api and loads results into component state.
   */
  async componentDidMount() {
    const { history } = this.props;

    const queryParams = qs.parse(history.location.search.slice(1));
    let route = '/ontologies';
    const omitted = [];
    const kbClass = SCHEMA_DEFN[queryParams['@class']];
    if (kbClass) {
      ({ routeName: route } = kbClass);
      omitted.push('@class');
    }
    queryParams.neighbors = queryParams.neighbors || DEFAULT_NEIGHBORS;
    queryParams.limit = queryParams.limit || DEFAULT_LIMIT;
    const response = await DataViewBase.makeApiQuery(route, queryParams, omitted);
    const { data, allProps } = this.processData(response);
    const {
      next,
      moreResults,
      filteredSearch,
    } = DataViewBase.prepareNextPagination(route, queryParams, response, omitted);

    this.setState({
      filteredSearch: filteredSearch || queryParams,
      moreResults,
      next,
      data,
      allProps,
    });
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
      data[record['@rid']] = record;
    });

    return { data, allProps };
  }

  /**
   * Triggered function for when a node object is clicked in a child component.
   * Sets the state selected ID to clicked node.
   * @param {Object} node - Clicked node identifier.
   */
  async handleClick(node) {
    const { data } = this.state;
    if (!data[node.data['@rid']]) {
      const { routeName } = SCHEMA_DEFN[node.data['@class']];
      const endpoint = `${routeName || '/ontologies'}/${node.data['@rid'].slice(1)}?neighbors=${DEFAULT_NEIGHBORS}`; // change
      const response = await api.get(endpoint);
      this.setState({ ...this.processData([jc.retrocycle(response).result]) });
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
      filteredSearch,
    } = this.state;

    if (next) {
      try {
        this.setState({
          next: null,
          moreResults: false,
          completedNext: false,
        });

        let route = '/ontologies';
        const omitted = [];
        const kbClass = SCHEMA_DEFN[filteredSearch['@class']];
        if (kbClass) {
          ({ routeName: route } = kbClass);
          omitted.push('@class');
        }

        const nextData = await next();

        this.setState({
          ...this.processData(nextData),
          ...DataViewBase.prepareNextPagination(route, filteredSearch, nextData, omitted),
          completedNext: true,
        });
      } catch (e) {
        // eslint-disable-next-line no-console
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
    const { history } = this.props;
    if (detail) {
      let route;
      const { inherits } = SCHEMA_DEFN[detail['@class']];
      if (inherits && inherits.includes('Ontology')) {
        route = 'ontology';
      } else if (inherits && inherits.includes('Variant')) {
        route = 'variant';
      } else if (detail['@class'] === 'Statement') {
        route = 'statement';
      }
      history.push(`/edit/${route}/${detail['@rid'].slice(1)}`);
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
    if (node.data) {
      node = node.data;
    }
    if (edge) {
      this.setState({
        detail: node,
        detailEdge: true,
      });
    } else {
      if (!data[node['@rid']]) {
        const response = await api.get(`/ontologies/${node['@rid'].slice(1)}?neighbors=${DEFAULT_NEIGHBORS}`);
        data[node['@rid']] = jc.retrocycle(response).result;
      }
      this.setState({ detail: data[node['@rid']], detailEdge: false });
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
    const defaultOrders = SCHEMA_DEFN[cls || 'Ontology'].identifiers;
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
        schema={schema}
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
        schema={schema}
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

const DataView = withKB(DataViewBase);

export {
  DataView,
  DataViewBase,
};
