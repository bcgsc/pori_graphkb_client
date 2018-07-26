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
      queryRedirect: false,
      loginRedirect: false,
      data: null,
      displayed: [],
      hidden: [],
      selectedId: null,
      allColumns: [],
      detail: false,
    };

    this.handleClick = this.handleClick.bind(this);
    this.handleCheckbox = this.handleCheckbox.bind(this);
    this.handleCheckAll = this.handleCheckAll.bind(this);
    this.handleHideSelected = this.handleHideSelected.bind(this);
    this.handleShowAllNodes = this.handleShowAllNodes.bind(this);
    this.handleNodeEditStart = this.handleNodeEditStart.bind(this);
    this.handleNewQuery = this.handleNewQuery.bind(this);
    this.handleDetailDrawerOpen = this.handleDetailDrawerOpen.bind(this);
    this.handleDetailDrawerClose = this.handleDetailDrawerClose.bind(this);
    this.handleGraphRedirect = this.handleGraphRedirect.bind(this);
    this.handleTableRedirect = this.handleTableRedirect.bind(this);
  }

  /**
   * Queries the api and loads results into component state.
   */
  async componentDidMount() {
    const dataMap = {};
    let { queryRedirect } = this.state;
    const { loginRedirect } = this.state;
    const { history } = this.props;

    const edgeTypes = await api.getOntologyEdges();
    const ontologyTypes = await api.getOntologyVertices();
    const schema = await api.getSchema();
    const { V } = schema;

    const filteredSearch = queryString.parse(history.location.search);
    const allColumns = ['@rid', '@class'];

    api.get(`/ontologies?${queryString.stringify(filteredSearch)}&neighbors=3`)
      .then((data) => {
        const cycled = jc.retrocycle(data.result);
        if (cycled.length === 0) queryRedirect = true;

        cycled.forEach((ontologyTerm) => {
          const ontologyClass = schema[ontologyTerm['@class']];
          const { properties } = ontologyClass;
          Object.keys(ontologyTerm).forEach((prop) => {
            if ((!V.properties[prop]) && !allColumns.includes(prop)) {
              const endpointProp = properties[prop];
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
          edgeTypes,
          ontologyTypes,
        });
      })
      .catch((error) => {
        if (error.status === 401) {
          history.push('/login');
        } else {
          history.push({ pathname: '/error', state: error });
        }
      });
  }

  /**
   * Triggered function for when a node object is clicked in a child component.
   * Sets the state selected ID to clicked node.
   * @param {string} rid - Clicked node identifier.
   */
  async handleClick(rid) {
    const { data } = this.state;
    const { history } = this.props;
    if (!data[rid]) {
      const endpoint = `/ontologies/${rid.slice(1)}?neighbors=3`;
      const json = await api.get(endpoint).catch((error) => {
        if (error.status === 401) {
          history.push('/login');
        } else {
          history.push({ pathname: '/error', state: error });
        }
      });
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
        queryRedirect: false,
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
      edgeTypes,
      ontologyTypes,
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
        <div className="graph-close-drawer-btn">
          <IconButton onClick={this.handleDetailDrawerClose}>
            <CloseIcon color="action" />
          </IconButton>
        </div>
        <NodeDetailComponent
          variant="graph"
          node={data[detail]}
          handleNodeEditStart={this.handleNodeEditStart}
        />
      </Drawer>
    );

    const GraphWithProps = () => (
      <GraphComponent
        data={data}
        handleClick={this.handleClick}
        displayed={displayed}
        selectedId={selectedId}
        handleNodeEditStart={this.handleNodeEditStart}
        handleDetailDrawerOpen={this.handleDetailDrawerOpen}
        handleTableRedirect={this.handleTableRedirect}
        edgeTypes={edgeTypes}
        ontologyTypes={ontologyTypes}
      />
    );
    const TableWithProps = () => (
      <TableComponent
        data={data}
        selectedId={selectedId}
        handleClick={this.handleClick}
        handleCheckbox={this.handleCheckbox}
        history={history}
        displayed={displayed}
        hidden={hidden}
        allColumns={allColumns}
        handleCheckAll={this.handleCheckAll}
        handleNodeEditStart={this.handleNodeEditStart}
        handleHideSelected={this.handleHideSelected}
        handleShowAllNodes={this.handleShowAllNodes}
        handleNewQuery={this.handleNewQuery}
        handleGraphRedirect={this.handleGraphRedirect}
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
            <React.Fragment>
              <Typography variant="headline">
                No Results
              </Typography>
            </React.Fragment>
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
