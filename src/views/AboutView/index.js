import React, { Component } from 'react';
import './index.scss';
import {
  Link,
  NavLink,
  Route,
  Switch,
} from 'react-router-dom';
import {
  Paper,
  Typography,
  ListItem,
  List,
  ListItemText,
  Tabs,
  Tab,

} from '@material-ui/core';
import marked from 'marked';
import slugify from 'slugify';


import notation from '@bcgsc/knowledgebase-parser/doc/notation.md';


import PieChart from '../../components/PieChart';
import api from '../../services/api';

// static content
import listFields from '../../static/tutorial/list-fields.png';
import linkFields from '../../static/tutorial/link-fields.png';
import selectFields from '../../static/tutorial/select-fields.png';
import queryResults from '../../static/tutorial/table-tutorial.png';
import graphResults from '../../static/tutorial/graph-tutorial.png';
import graphActions from '../../static/tutorial/graph-actions.png';
import config from '../../static/config';

const { API_BASE_URL } = config;
const PAGE_ELEVATION = 4;


const AboutQuerying = () => (
  <div>
    <Typography variant="h5" component="h2" id="about-querying">
      Querying
    </Typography>
    <Typography paragraph>
      To query GraphKB using this GUI, navigate to the&nbsp;
      <Link to="/query">Query</Link> page by using the navbar on the left. To query
      using this page, simply type into the search bars and hit enter or
      click on the search icon on the right.
    </Typography>
    <Typography paragraph>
      To access the <Link to="/query/advanced">Advanced Query</Link> page, click on the labelled
      button. The Advanced Query page allows more specific queries to be
      made to the database. The first thing to do when building a query is
      to choose a record class. The dropdown contains a list of classes to choose
      from, and in doing so, you will change the available form fields to
      fill out, as certain classes have different properties than others.
    </Typography>
    <Typography paragraph>
      If you wish for more control over your query, the&nbsp;
      <Link to="/query/advanced/builder">Query Builder</Link> page
      removes all guides and lets you send whatever queries you want to the
      database. Navigate from the Advanced Query page by clicking the
      button in the top right corner. It is recommended for beginners to
      read the GraphKB specification to better understand the classes and
      the different querying features. Queries made by the Query Builder
      follow the complex POST query syntax, which can be found&nbsp;
      <a href={`${API_BASE_URL}/spec`} rel="noopener noreferrer" target="_blank">here</a>.
    </Typography>
  </div>
);


const AboutForms = () => (
  <div>
    <Typography variant="h5" component="h2" paragraph id="about-forms">
      GraphKB Forms
    </Typography>
    <List>
      <ListItem>
        <Typography paragraph>
          When filling out forms, certain fields will behave differently from
          others based on the type of input. The following are several of the
          core field types that you will encounter when interacting with
          GraphKB through this GUI:
        </Typography>
      </ListItem>
      <ListItem>
        <figure className="two-column-grid">
          <img src={listFields} alt="List Fields" />
          <figcaption>
            <ListItemText
              primary="List Fields"
              secondary={`
                      List fields are used for properties that are lists of
                      strings. To use these, simply type the item you wish to add
                      to the list, and press enter or click the add button to add
                      it to the list. Items can be deleted by backspacing against
                      them or clicking the "x" shown in the example image.
                    `}
            />
          </figcaption>
        </figure>

      </ListItem>
      <ListItem>
        <figure className="two-column-grid">
          <img src={linkFields} alt="Link Fields" />
          <figcaption>
            <ListItemText
              primary="Link Fields"
              secondary={`
                      Some records in GraphKB are dependent on or reference others.
                      To express these links in forms, a small query bar is
                      included to allow you to find the linked record you need.
                      Start typing and wait for the dropdown list of items to
                      appear for you to pick from. The default query logic is to
                      match the record "name" property. If you require more control
                      over finding this linked record, some link fields have an
                      expand button that creates a mini-form to fill out, similar
                      to the Advanced Query form. You can clear the existing linked
                      record by clicking the "x" as shown in the example image.
                  `}
            />
          </figcaption>
        </figure>
      </ListItem>
      <ListItem>
        <figure className="two-column-grid">
          <img src={selectFields} alt="Select Fields" />
          <figcaption>
            <ListItemText
              primary="Select Fields"
              secondary="Select fields are used to select an item from a set of
                      options. Most selects are able to be set to a null/empty
                      value, but for mandatory selects an option must be chosen
                      before submitting the form."
            />
          </figcaption>
        </figure>
      </ListItem>
    </List>
  </div>
);


const AboutTableView = () => (
  <div>
    <Typography variant="h5" component="h2" paragraph id="about-results-table">
      Viewing Results (Table)
    </Typography>
    <figure className="two-column-grid">
      <img src={queryResults} alt="Query Results" />
      <figcaption>
        <List>
          <ListItem>
            <Typography>
              After sending a query, result records will be loaded into the&nbsp;
              <Link to="/data/table">Table view</Link>. From here, you can:
            </Typography>
          </ListItem>
          <ListItem>
            <ListItemText primary="Filter" secondary="Filter rows to isolate specific records" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Sort" secondary="Sort rows based on columns" />
          </ListItem>
          <ListItem>
            <ListItemText primary="View Details" secondary="Click records to view details in a side drawer" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Download" secondary="Download the query results as a TSV file" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Hide" secondary="Hide rows from the table" />
          </ListItem>
          <ListItem>
            <ListItemText primary="View Graph" secondary="View current records in Graph form" />
          </ListItem>
        </List>
      </figcaption>
    </figure>
  </div>
);


const AboutGraphView = () => (
  <div>
    <Typography variant="h5" component="h2" paragraph id="about-results-graph">
      Viewing Results (Graph)
    </Typography>
    <figure className="two-column-grid">
      <img
        src={graphResults}
        alt="Graph"
      />
      <figcaption>
        <Typography variant="body1">
          The <Link to="/data/graph?@class=Disease">Graph view</Link> can be used to view clusters of records and their
          relationships with eachother. Click and drag nodes with your mouse
          or finger, and open the Graph settings to change labels, coloring
          schemes, and physical behavior of the graph and its constituents.
        </Typography>
      </figcaption>
    </figure>
    <Typography variant="body1">
      After clicking a graph node or link, you will see this actions ring
      appear, which will allow you to
    </Typography>
    <figure className="two-column-grid">
      <img
        src={graphActions}
        alt="Graph Node Actions"
      />
      <figcaption>
        <Typography variant="body1">
          <List>
            <ListItem>
              <ListItemText primary="Expand" secondary="Expand the record to view its related records" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Hide" secondary="Hide the record from the graph" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Details" secondary="View record details in a side drawer" />
            </ListItem>
          </List>
        </Typography>
      </figcaption>
    </figure>
  </div>
);


class AboutView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stats: [{ label: '', value: 0 }], // so that the page doesn't wait to load
      notationMd: '',
      apiVersion: '',
      dbVersion: '',
      guiVersion: process.env.npm_package_version || process.env.REACT_APP_VERSION || '',
      tabIndex: 0,
    };

    this.getClassStats = this.getClassStats.bind(this);
    this.getMarkdownContent = this.getMarkdownContent.bind(this);
    this.getVersionInfo = this.getVersionInfo.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.controllers = [];
  }

  async componentDidMount() {
    await Promise.all([
      this.getClassStats(),
      this.getMarkdownContent(),
      this.getVersionInfo(),
    ]);
  }

  componentWillUnmount() {
    this.controllers.forEach(c => c.abort());
  }

  async getMarkdownContent() {
    const controller = new AbortController();
    this.controllers.push(controller);

    const file = await fetch(notation, { signal: controller.signal });
    const text = await file.text();
    this.setState({ notationMd: marked(text) });
  }

  async getClassStats() {
    const call = api.get('/stats');
    this.controllers.push(call);

    const stats = await call.request();

    this.setState({
      stats: Array.from(
        Object.keys(stats.result),
        label => ({ label, value: stats.result[label] }),
      ),
    });
  }

  async getVersionInfo() {
    const call = api.get('/version');
    this.controllers.push(call);
    const versions = await call.request();
    this.setState({
      apiVersion: versions.api,
      dbVersion: versions.db,
    });
  }

  handleChange(event, value) {
    this.setState({ tabIndex: value });
  }

  render() {
    const {
      stats, notationMd, apiVersion, guiVersion, dbVersion, tabIndex,
    } = this.state;

    const AboutMain = () => (
      <div className="two-column-grid">
        <PieChart
          height={500}
          width={500}
          innerRadius={50}
          data={stats}
          colorThreshold={0.05}
        />
        <div className="pie-partner">
          <Typography paragraph>
                Knowlegebase is a curated database of variants in cancer and their therapeutic,
                biological, diagnostic, and prognostic implications according to literature. The
                main use of Knowlegebase is to act as the link between the known and published
                variant information and the expermientally collected data.
          </Typography>
          <Typography variant="h6" component="h4">
                Current Version
          </Typography>
          <Typography paragraph>
                DB ({dbVersion}); API (v{apiVersion}); GUI (v{guiVersion})
          </Typography>
        </div>
      </div>
    );

    const tabsList = [
      ['About', AboutMain],
      ['Query', AboutQuerying],
      ['View Table', AboutTableView],
      ['View Graph', AboutGraphView],
      ['Input Data', AboutForms],
      ['Notation', () => (
        <div
          id="about-variant-notation"
          dangerouslySetInnerHTML={{ __html: notationMd }}
        />
      )],
    ];

    const tabNavList = tabsList.map(([label], index) => (
      <Tab
        label={label}
        component={NavLink}
        key={label}
        value={index}
        to={
          index === 0
            ? '/about'
            : `/about/${slugify(label).toLowerCase()}`
        }
      />
    ));

    const tabsRouteList = tabsList.map(([label, component], index) => (
      <Route
        label={label}
        key={label}
        component={component}
        exact
        path={
          index === 0
            ? '/about'
            : `/about/${slugify(label).toLowerCase()}`
        }
      />
    ));

    return (
      <Paper position="static" elevation={PAGE_ELEVATION} className="about-page">
        <Tabs value={tabIndex} onChange={this.handleChange} scrollable>
          {tabNavList}
        </Tabs>
        <div className="tabs-content">
          <Switch>
            {tabsRouteList}
          </Switch>
        </div>
      </Paper>
    );
  }
}

export default AboutView;
