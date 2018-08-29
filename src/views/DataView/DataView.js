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
  Drawer,
  IconButton,
  Snackbar,
  Button,
  Typography,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { withStyles } from '@material-ui/core/styles';
import qs from 'qs';
import GraphComponent from '../../components/GraphComponent/GraphComponent';
import TableComponent from '../../components/TableComponent/TableComponent';
import NodeDetailComponent from '../../components/NodeDetailComponent/NodeDetailComponent';
import api from '../../services/api';

const styles = {
  paper: {
    width: '500px',
    '@media (max-width: 768px)': { width: 'calc(100% - 1px)' },
  },
};

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
class DataView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loginRedirect: false,
      data: null,
      displayed: [],
      hidden: [],
      selectedId: null,
      allProps: [],
      detail: null,
      next: null,
      completedNext: true,
      filteredSearch: null,
    };

    this.handleClick = this.handleClick.bind(this);

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
    this.handleNewQuery = this.handleNewQuery.bind(this);

    // Routing methods
    this.handleGraphRedirect = this.handleGraphRedirect.bind(this);
    this.handleTableRedirect = this.handleTableRedirect.bind(this);
  }

  /**
   * Queries the api and loads results into component state.
   */
  async componentDidMount() {
    const dataMap = {};
    const { loginRedirect } = this.state;
    const { history } = this.props;

    const schema = await api.getSchema();
    const filteredSearch = qs.parse(history.location.search.slice(1));
    let route = '/ontologies';
    if (filteredSearch['@class'] && schema[filteredSearch['@class']]) {
      route = schema[filteredSearch['@class']].route || filteredSearch['@class'];
    }

    let allProps = ['@rid', '@class'];
    try {
      const data = await api.get(`${route}?${qs.stringify(filteredSearch)}&neighbors=3`);
      const cycled = jc.retrocycle(data).result;

      cycled.forEach((ontologyTerm) => {
        allProps = api.collectOntologyProps(ontologyTerm, allProps, schema);
        dataMap[ontologyTerm['@rid']] = ontologyTerm;
      });

      if (cycled.length >= (filteredSearch.limit || DEFAULT_LIMIT)) {
        const nextFilteredSearch = Object.assign({}, filteredSearch);
        nextFilteredSearch.skip = filteredSearch.limit || DEFAULT_LIMIT;
        this.setState({
          next: () => api.get(`${route}?${qs.stringify(nextFilteredSearch)}&neighbors=3`),
          moreResults: true,
        });
      }
      this.setState({
        data: dataMap,
        selectedId: Object.keys(dataMap)[0],
        loginRedirect,
        allProps,
        schema,
        filteredSearch,
        edges: api.getEdges(schema),
      });
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Triggered function for when a node object is clicked in a child component.
   * Sets the state selected ID to clicked node.
   * @param {string} rid - Clicked node identifier.
   */
  async handleClick(rid) {
    const { data } = this.state;
    if (!data[rid]) {
      const endpoint = `/ontologies/${rid.slice(1)}?neighbors=3`;
      const response = await api.get(endpoint);
      data[rid] = jc.retrocycle(response).result;
      this.setState({ data });
    }
    this.setState({ selectedId: rid });
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
   * Handles subsequent pagination call
   */
  async handleSubsequentPagination() {
    const { next } = this.state;

    if (next) {
      try {
        this.setState({ next: null, moreResults: false, completedNext: false });
        const nextData = await next();
        const {
          data,
          allProps,
          schema,
          filteredSearch,
        } = this.state;
        const cycled = jc.retrocycle(nextData).result;
        let newColumns = allProps;
        cycled.forEach((ontologyTerm) => {
          newColumns = api.collectOntologyProps(ontologyTerm, allProps, schema);
          data[ontologyTerm['@rid']] = ontologyTerm;
        });

        let route = '/ontologies';
        if (filteredSearch['@class']) {
          route = schema[filteredSearch['@class']].route;
        }

        let newNext = null;
        let moreResults = false;
        const limit = filteredSearch.limit || DEFAULT_LIMIT;
        const lastSkip = filteredSearch.skip || limit;
        if (cycled.length >= limit) {
          filteredSearch.skip = lastSkip + limit;
          newNext = () => api.get(`${route}?${qs.stringify(filteredSearch)}&neighbors=3`);
          moreResults = true;
        }
        this.setState({
          data,
          allProps: newColumns,
          next: newNext,
          filteredSearch,
          moreResults,
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
   * @param {string} rid - Target node rid.
   */
  handleNodeEditStart(rid) {
    const { data } = this.state;
    const { history } = this.props;
    history.push({
      pathname: `/edit/${rid.slice(1)}`,
      state: {
        node: data[rid],
      },
    });
  }

  /**
   * Re initializes the component and loads a new query into the search.
   * @param {string} search - new search string
   */
  handleNewQuery(search) {
    const { history } = this.props;
    const { location } = history;

    if (location.search.split('?')[1] !== search) {
      history.push(`/data/table?${search}`);
      this.setState({
        loginRedirect: false,
        data: null,
        displayed: [],
        hidden: [],
        selectedId: null,
        allProps: [],
      }, this.componentDidMount);
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
      this.setState({ detail: node.data, detailEdge: true });
    } else {
      if (!data[node.data['@rid']]) {
        const response = await api.get(`/ontologies/${node.data['@rid'].slice(1)}?neighbors=3`);
        data[node.data['@rid']] = jc.retrocycle(response).result;
      }
      this.setState({ detail: data[node.data['@rid']], detailEdge: false });
    }
  }

  /**
   * Handles redirect to graph from table.
   */
  handleGraphRedirect() {
    const { history } = this.props;
    history.push({ pathname: '/data/graph', search: history.location.search });
  }

  /**
   * Handles redirect to table from graph.
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
    const { allProps, schema } = this.state;
    this.setState({ allProps: api.collectOntologyProps(node, allProps, schema) });
  }

  render() {
    const {
      selectedId,
      data,
      displayed,
      hidden,
      allProps,
      detail,
      schema,
      moreResults,
      filteredSearch,
      edges,
      detailEdge,
      completedNext,
    } = this.state;

    const {
      classes,
      history,
    } = this.props;

    if (!data) return <CircularProgress color="secondary" size={100} id="progress-spinner" />;

    const detailDrawer = (
      <Drawer
        variant="persistent"
        anchor="right"
        open={!!detail}
        classes={{
          paper: classes.paper,
        }}
        onClose={this.handleDetailDrawerClose}
        SlideProps={{ unmountOnExit: true }}
      >
        <NodeDetailComponent
          variant="graph"
          node={detail}
          handleNodeEditStart={this.handleNodeEditStart}
          handleNewQuery={this.handleNewQuery}
          handleClose={this.handleDetailDrawerClose}
          detailEdge={detailEdge}
        >
          <IconButton onClick={this.handleDetailDrawerClose}>
            <CloseIcon color="action" />
          </IconButton>
        </NodeDetailComponent>
      </Drawer>
    );

    const GraphWithProps = () => (
      <GraphComponent
        data={data}
        handleClick={this.handleClick}
        displayed={displayed}
        handleNodeEditStart={this.handleNodeEditStart}
        handleDetailDrawerOpen={this.handleDetailDrawerOpen}
        handleDetailDrawerClose={this.handleDetailDrawerClose}
        handleTableRedirect={this.handleTableRedirect}
        schema={schema}
        edges={edges}
        detail={detail}
        allProps={allProps}
        filteredSearch={filteredSearch}
        handleNewColumns={this.handleNewColumns}
      />
    );
    const TableWithProps = () => (
      <TableComponent
        data={data}
        selectedId={selectedId}
        handleClick={this.handleClick}
        handleCheckbox={this.handleCheckbox}
        displayed={displayed}
        hidden={hidden}
        allProps={allProps}
        moreResults={moreResults}
        completedNext={completedNext}
        handleCheckAll={this.handleCheckAll}
        handleNodeEditStart={this.handleNodeEditStart}
        handleHideSelected={this.handleHideSelected}
        handleShowAllNodes={this.handleShowAllNodes}
        handleNewQuery={this.handleNewQuery}
        handleGraphRedirect={this.handleGraphRedirect}
        handleSubsequentPagination={this.handleSubsequentPagination}
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
        {detailDrawer}
        {Object.keys(data).length !== 0
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
              <Typography variant="headline">
                No Results
              </Typography>
            </div>
          )
        }
      </div>);
  }
}

DataView.propTypes = {
  /**
   * @param {Object} history - Application routing history object.
   */
  history: PropTypes.object.isRequired,
  /**
   * @param {Object} classes - Classes provided by the @material-ui withStyles function
   */
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(DataView);
