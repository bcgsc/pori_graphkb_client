/**
 * @module /views/DataView
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect, Switch } from 'react-router-dom';
import {
  CircularProgress,
  Typography,
} from '@material-ui/core';
import qs from 'qs';
import omit from 'lodash.omit';
import { boundMethod } from 'autobind-decorator';

import { SnackbarContext } from '@bcgsc/react-snackbar-provider';

import './DataView.scss';
import { GraphComponent, DetailDrawer, TableComponent } from './components';
import { withKB } from '../../components/KBContext';
import api from '../../services/api';
import config from '../../static/config';

const { DEFAULT_NEIGHBORS } = config;
const DEFAULT_LIMIT = 100;

/**
 * View for managing state of query results. Contains sub-routes for table view (/data/table)
 * and graph view (/data/graph) to display data. Redirects to /data/table for all other
 * sub-routes.
 *
 * Handles all api calls for its child components, including firing the passed in query
 * from the url search string, retrieving the database schema, and making subsequent
 * individual record GETs throughout the user's session.
 *
 * @property {Object} props.history - Application routing history object.
 * @property {Object} props.schema - Knowledgebase schema object.
 */
class DataViewBase extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
    schema: PropTypes.object.isRequired,
  };

  static contextType = SnackbarContext;

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

    this.controllers = [];
  }

  /**
   * Queries the api and loads results into component state.
   */
  async componentDidMount() {
    const { history, schema } = this.props;
    const snackbar = this.context;
    const queryParams = qs.parse(history.location.search.slice(1));
    let isComplex = false;

    let { routeName } = schema.get('V');
    const omitted = [];
    const kbClass = schema.get(queryParams);
    if (kbClass) {
      ({ routeName } = kbClass);
      omitted.push('@class');
    }

    let response;
    try {
      if (queryParams.keyword) {
        routeName = '/search';
        queryParams.neighbors = queryParams.neighbors || DEFAULT_NEIGHBORS;
        queryParams.limit = queryParams.limit || DEFAULT_LIMIT;
        response = await this.makeApiQuery(routeName, queryParams);
      } else if (queryParams.complex) {
        routeName += '/search';
        isComplex = true;
        // Decode base64 encoded string.
        const payload = JSON.parse(atob(decodeURIComponent(queryParams.complex)));
        payload.neighbors = Math.max(payload.neighbors || 0, DEFAULT_NEIGHBORS);
        payload.limit = Math.min(payload.limit || DEFAULT_LIMIT, DEFAULT_LIMIT);
        response = await this.makeComplexApiQuery(routeName, payload, omitted);
      } else {
        queryParams.neighbors = queryParams.neighbors || DEFAULT_NEIGHBORS;
        queryParams.limit = queryParams.limit || DEFAULT_LIMIT;
        response = await this.makeApiQuery(routeName, queryParams, omitted);
      }

      const { data, allProps } = this.processData(response);

      const {
        next,
        moreResults,
        filteredSearch,
      } = !isComplex
        ? this.prepareNextPagination(routeName, queryParams, response, omitted)
        : {
          moreResults: false,
          next: null,
          filteredSearch: null,
        };
      if (Object.keys(data).length === 0) {
        snackbar.add(
          'No results found, redirecting...',
          'Back',
          () => history.back(),
        );
      }
      this.setState({
        filteredSearch: filteredSearch || queryParams,
        moreResults,
        next,
        data,
        allProps,
      });
    } catch (error) {
      console.error(error);
    }
  }

  componentWillUnmount() {
    this.controllers.forEach(c => c.abort());
  }

  /**
   * Prepares next query function.
   * @param {string} route - API route.
   * @param {Object} queryParams - Query parameters key/value pairs.
   * @param {Array.<Object>} prevResult - Previous query results.
   * @param {Array.<string>} omitted - List of property keys to omit during next query.
   */
  prepareNextPagination(route, queryParams, prevResult, omitted = []) {
    const nextQueryParams = queryParams;
    if (prevResult.length >= queryParams.limit) {
      nextQueryParams.skip = Number(queryParams.limit) + Number(queryParams.skip || 0);
      return {
        next: () => this.makeApiQuery(route, nextQueryParams, omitted),
        moreResults: true,
        filteredSearch: nextQueryParams,
      };
    }
    return {
      next: null,
      moreResults: false,
    };
  }

  /**
   * Makes API GET call to specified endpoint, with specified query parameters.
   * @param {string} route - API endpoint.
   * @param {Object} queryParams - Query parameters object.
   * @param {Array.<string>} omitted - List of parameters to strip from API call.
   */
  async makeApiQuery(route, queryParams, omitted = []) {
    const call = api.get(`${route}?${qs.stringify(omit(queryParams, omitted))}`);
    this.controllers.push(call);
    const result = await call.request();
    return result;
  }

  /**
   * Makes API POST call to specified endpoint, with specified payload.
   * @param {string} route - API endpoint.
   * @param {Object} payload - Query payload object.
   * @param {Array.<string>} omitted - List of parameters to strip from API call.
   */
  async makeComplexApiQuery(route, payload, omitted = []) {
    const call = api.post(route, omit(payload, omitted));
    this.controllers.push(call);
    const result = await call.request();
    return result;
  }

  /**
   * Processes ontology data and updates properties map.
   * @param {Array.<Object>} queryResults - List of returned records.
   * @param {Object} schema - Knowledgebase db schema.
   */
  processData(queryResults) {
    let { allProps, data } = this.state;
    const { schema } = this.props;
    if (!data) {
      data = {};
    }
    if (!allProps || allProps.length === 0) {
      allProps = ['@rid', '@class', 'preview'];
    }

    (queryResults || []).forEach((record) => {
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
  @boundMethod
  async handleClick(node) {
    const { schema } = this.props;
    const { data } = this.state;
    if (!data[node.data['@rid']]) {
      const { routeName } = schema.get(node.data);
      const endpoint = `${routeName || '/ontologies'}/${node.data['@rid'].slice(1)}?neighbors=${DEFAULT_NEIGHBORS}`; // change
      const call = api.get(endpoint);
      this.controllers.push(call);
      const { result } = await call.request();
      this.setState({ ...this.processData([result]) });
    }
  }

  /**
   * Adds node identifier to list of displayed nodes.
   * @param {Event} event - User checkbox event.
   * @param {string} rid - Checked node identifier.
   */
  @boundMethod
  handleCheckbox(event, rid) {
    event.stopPropagation();
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
   * @param {Event} event - Checkbox event.
   * @param {Array.<Object>} - Currently displayed page data.
   */
  @boundMethod
  handleCheckAll(event, pageData) {
    let displayed;
    if (event.target.checked) {
      displayed = pageData.map(d => d['@rid']);
    } else {
      displayed = [];
    }
    this.setState({ displayed });
  }

  /**
   * Clears displayed array.
   */
  @boundMethod
  handleHideSelected() {
    const { displayed, hidden } = this.state;
    hidden.push(...displayed);
    this.setState({ hidden, displayed: [] });
  }

  /**
   * Appends the input array to the displayed array.
   */
  @boundMethod
  handleShowAllNodes() {
    const { displayed, hidden } = this.state;
    displayed.push(...hidden);
    this.setState({ displayed, hidden: [] });
  }

  /**
   * Handles subsequent pagination call
   */
  @boundMethod
  async handleSubsequentPagination() {
    const { schema } = this.props;
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

        let { routeName } = schema.get('V');
        const omitted = [];
        const kbClass = schema.get(filteredSearch);
        if (kbClass) {
          ({ routeName } = kbClass);
          omitted.push('@class');
        }
        if (filteredSearch.keyword) {
          routeName = '/search';
        }
        const nextData = await next();

        this.setState({
          ...this.processData(nextData),
          ...this.prepareNextPagination(routeName, filteredSearch, nextData, omitted),
          completedNext: true,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }
    return next;
  }

  /**
   * Sets selected ID to input node identifier and opens edit drawer.
   */
  @boundMethod
  handleNodeEditStart() {
    const { detail } = this.state;
    const { history } = this.props;
    if (detail) {
      history.push(`/edit/${detail['@rid'].slice(1)}`);
    }
  }

  /**
   * Closes detail drawer.
   */
  @boundMethod
  handleDetailDrawerClose() {
    this.setState({ detail: null });
  }

  /**
   * Updates data and opens detail drawer for the specified node.
   * @param {Object} node - Specified node.
   * @param {boolean} open - flag to open drawer, or to just update.
   * @param {boolean} edge - flag to indicate edge record.
   */
  @boundMethod
  async handleDetailDrawerOpen(node, open, edge) {
    const { data, detail } = this.state;
    if (!open && !detail) return;
    if (node.data) {
      node = node.data; // eslint-disable-line no-param-reassign
    }
    if (edge) {
      this.setState({
        detail: node,
        detailEdge: true,
      });
    } else {
      if (!data[node['@rid']]) {
        const call = api.get(`/v/${node['@rid'].slice(1)}?neighbors=${DEFAULT_NEIGHBORS}`);
        this.controllers.push(call);
        const { result } = await call.request();
        data[node['@rid']] = result;
      }
      this.setState({ detail: data[node['@rid']], detailEdge: false });
    }
  }

  /**
   * Handles redirect to table to graph.
   */
  @boundMethod
  handleGraphRedirect(filters) {
    const { history } = this.props;
    this.setState({ storedFilters: filters, detail: null });
    history.push({ pathname: '/data/graph', search: history.location.search });
  }

  /**
   * Handles redirect to graph to table.
   */
  @boundMethod
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
  @boundMethod
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

    const snackbar = this.context;

    if (!data) {
      return <CircularProgress color="secondary" size={100} id="progress-spinner" />;
    }
    const edges = schema.getEdges();
    const cls = filteredSearch && filteredSearch['@class'];
    const defaultOrders = (schema.get(cls) || schema.get('V')).identifiers;
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
        snackbar={snackbar}
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
      </div>
    );
  }
}

const DataView = withKB(DataViewBase);

export {
  DataView,
  DataViewBase,
};
