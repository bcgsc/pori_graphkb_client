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
import queryString from 'query-string';
import GraphComponent from '../../components/GraphComponent/GraphComponent';
import TableComponent from '../../components/TableComponent/TableComponent';
import NodeDetailComponent from '../../components/NodeDetailComponent/NodeDetailComponent';
import api from '../../services/api';
import util from '../../services/util';

const styles = {
  paper: {
    width: '500px',
    '@media (max-width: 768px)': { width: 'calc(100% - 1px)' },
  },
};

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
      allColumns: [],
      detail: null,
      next: null,
      filteredSearch: null,
    };

    this.handleClick = this.handleClick.bind(this);

    // TableComponent methods
    this.handleCheckbox = this.handleCheckbox.bind(this);
    this.handleCheckAll = this.handleCheckAll.bind(this);
    this.handleHideSelected = this.handleHideSelected.bind(this);
    this.handleShowAllNodes = this.handleShowAllNodes.bind(this);
    this.handleTriggerNext = this.handleTriggerNext.bind(this);

    // GraphComponent methods
    this.handleDetailDrawerOpen = this.handleDetailDrawerOpen.bind(this);
    this.handleDetailDrawerClose = this.handleDetailDrawerClose.bind(this);

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
    const filteredSearch = queryString.parse(history.location.search);
    let route = '/ontologies';

    if (filteredSearch['@class']) {
      route = schema[filteredSearch['@class']].route;
    }

    let allColumns = ['@rid', '@class'];

    try {
      const data = await api.get(`${route}?${queryString.stringify(filteredSearch)}&neighbors=3`);
      const cycled = jc.retrocycle(data.result);

      cycled.forEach((ontologyTerm) => {
        allColumns = util.collectOntologyProps(ontologyTerm, allColumns, schema);
        dataMap[ontologyTerm['@rid']] = ontologyTerm;
      });

      if (cycled.length >= filteredSearch.limit || 1000) {
        filteredSearch.skip = filteredSearch.limit || 1000;
        this.setState({ next: () => api.get(`${route}?${queryString.stringify(filteredSearch)}&neighbors=3`) });
      }
      this.setState({
        data: dataMap,
        selectedId: Object.keys(dataMap)[0],
        loginRedirect,
        allColumns,
        schema,
        filteredSearch,
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
      const json = await api.get(endpoint);
      data[rid] = jc.retrocycle(json.result);
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

  handleTriggerNext() {
    const { next } = this.state;

    if (next) {
      next().then((nextData) => {
        const {
          data,
          allColumns,
          schema,
          filteredSearch,
        } = this.state;
        const cycled = jc.retrocycle(nextData.result);
        let newColumns = allColumns;
        cycled.forEach((ontologyTerm) => {
          newColumns = util.collectOntologyProps(ontologyTerm, allColumns, schema);
          data[ontologyTerm['@rid']] = ontologyTerm;
        });

        let route = '/ontologies';
        if (filteredSearch['@class']) {
          route = schema[filteredSearch['@class']].route;
        }

        let newNext = null;
        if (cycled.length >= (filteredSearch.limit || 1000)) {
          filteredSearch.skip += (filteredSearch.limit || 1000);
          newNext = () => api.get(`${route}?${queryString.stringify(filteredSearch)}&neighbors=3`);
        }
        this.setState({
          data,
          allColumns: newColumns,
          next: newNext,
          filteredSearch,
        });
      });
    }
    this.setState({ next: null });
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
        allColumns: [],
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
   */
  async handleDetailDrawerOpen(node, open) {
    const { data, detail } = this.state;
    if (!open && !detail) return;
    if (!data[node.data['@rid']]) {
      const response = await api.get(`/ontologies/${node.data['@rid'].slice(1)}?neighbors=3`);
      data[node.data['@rid']] = jc.retrocycle(response.result);
    }
    this.setState({ detail: node.data['@rid'] });
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
    this.setState({ detail: '' });
    history.push({
      pathname: '/data/table',
      search: history.location.search,
    });
  }

  render() {
    const {
      selectedId,
      data,
      displayed,
      hidden,
      allColumns,
      detail,
      schema,
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
          node={data[detail]}
          handleNodeEditStart={this.handleNodeEditStart}
          handleNewQuery={this.handleNewQuery}
          handleClose={this.handleDetailDrawerClose}
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
        detail={detail}
        allColumns={allColumns}
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
        allColumns={allColumns}
        handleCheckAll={this.handleCheckAll}
        handleNodeEditStart={this.handleNodeEditStart}
        handleHideSelected={this.handleHideSelected}
        handleShowAllNodes={this.handleShowAllNodes}
        handleNewQuery={this.handleNewQuery}
        handleGraphRedirect={this.handleGraphRedirect}
        handleTriggerNext={this.handleTriggerNext}
      />
    );
    return (
      <div className="data-view">
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={Object.keys(data).length === 0}
          onClose={history.goBack}
          autoHideDuration={3000}
          message={(
            <span>
              No results found, redirecting...
            </span>
          )}
          action={(
            <Button color="secondary" onClick={history.goBack}>
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

/**
 * @param {Object} history - Application routing history object.
 * @param {Object} classes - Classes provided by the @material-ui withStyles function
 */
DataView.propTypes = {
  history: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(DataView);
