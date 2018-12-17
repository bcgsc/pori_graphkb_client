/**
 * @module /views/TutorialView
 */
import React from 'react';
import './TutorialView.css';
import {
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import listFields from '../../static/tutorial/list-fields.png';
import linkFields from '../../static/tutorial/link-fields.png';
import selectFields from '../../static/tutorial/select-fields.png';
import queryResults from '../../static/tutorial/table-tutorial.png';
import graphResults from '../../static/tutorial/graph-tutorial.png';
import graphActions from '../../static/tutorial/graph-actions.png';
import config from '../../static/config';

const { API_BASE_URL } = config;
const HGVS_LINK = 'https://varnomen.hgvs.org/';

/**
 * Tutorial page
 */
function TutorialView() {
  return (
    <div className="tutorial-wrapper">
      <Paper className="tutorial-header" elevation={4}>
        <Typography variant="h5">Tutorial</Typography>
      </Paper>
      <Paper className="tutorial-body" elevation={4}>
        <Typography variant="subtitle1" component="h4" paragraph>
          <a href="querying">
            Querying
          </a>
        </Typography>
        <Typography paragraph>
          To query GraphKB using this GUI, navigate to the
          &quot;Query&quot; page by using the navbar on the left. To query
          using this page, simply type into the search bars and hit enter or
          click on the search icon on the right.
        </Typography>
        <Typography paragraph>
          To access the Advanced Query page, click on the labelled
          button. The Advanced Query page allows more specific queries to be
          made to the database. The first thing to do when building a query is
          to choose a record class. The dropdown contains a list of classes to choose
          from, and in doing so, you will change the available form fields to
          fill out, as certain classes have different properties than others.
        </Typography>
        <Typography paragraph>
          If you wish for more control over your query, the Query Builder page
          removes all guides and lets you send whatever queries you want to the
          database. Navigate from the Advanced Query page by clicking the
          button in the top right corner. It is recommended for beginners to
          read the GraphKB specification to better understand the classes and
          the different querying features. Queries made by the Query Builder
          follow the complex POST query syntax, which can be found&nbsp;
          <a href={`${API_BASE_URL}/spec`} rel="noopener noreferrer" target="_blank">here</a>.
        </Typography>
      </Paper>
      <Paper className="tutorial-body" elevation={4}>
        <Typography variant="subtitle1" component="h4" paragraph>
          <a href="forms">
            GraphKB Forms
          </a>
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
          <ListItem className="form-list-item">
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
            <img src={listFields} alt="List Fields" />
          </ListItem>
          <ListItem className="form-list-item">
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
            <img src={linkFields} alt="Link Fields" />
          </ListItem>
          <ListItem className="form-list-item">
            <ListItemText
              primary="Select Fields"
              secondary="Select fields are used to select an item from a set of
                  options. Most selects are able to be set to a null/empty
                  value, but for mandatory selects an option must be chosen
                  before submitting the form."
            />
            <img src={selectFields} alt="Select Fields" />
          </ListItem>
        </List>
        <Typography variant="subtitle1" component="h4" paragraph>
          HGVS Shorthand
        </Typography>
        <ListItem>
          <Typography paragraph>
            Variant Forms can be filled out using HGVS shorthand notation. Learn more&nbsp;
            <a href={HGVS_LINK} target="_blank" rel="noopener noreferrer">here</a>.
          </Typography>
        </ListItem>
      </Paper>
      <Paper className="tutorial-body" elevation={4}>
        <Typography variant="subtitle1" component="h4" paragraph>
          <a href="Query View">
            Viewing Results
          </a>
        </Typography>
        <List>
          <ListItem>
            <Typography variant="subtitle2">Table</Typography>
          </ListItem>
          <ListItem>
            <img src={queryResults} alt="Query Results" className="tutorial-central-image" />
          </ListItem>
          <ListItem>
            After sending a query, results will be loaded into this table for
            viewing. From here, you can:
          </ListItem>
          <ListItem>
            <ListItemText inset primary="Filter columns to isolate specific records" />
          </ListItem>
          <ListItem>
            <ListItemText inset primary="Sort columns" />
          </ListItem>
          <ListItem>
            <ListItemText inset primary="Click records to view details in a side drawer" />
          </ListItem>
          <ListItem>
            <ListItemText inset primary="Download the query results as a TSV file" />
          </ListItem>
          <ListItem>
            <ListItemText inset primary="Hide rows from the table" />
          </ListItem>
          <ListItem>
            <ListItemText inset primary="View records in Graph form" />
          </ListItem>
        </List>
        <List>
          <ListItem>
            <Typography variant="subtitle2">Graph</Typography>
          </ListItem>
          <ListItem>
            <img
              src={graphResults}
              alt="Graph"
              className="tutorial-central-image"
            />
          </ListItem>
          <ListItem>
            The Graph view can be used to view clusters of records and their
            relationships with eachother. Click and drag nodes with your mouse
            or finger, and open the Graph settings to change labels, coloring
            schemes, and physical behavior of the graph and its constituents.
          </ListItem>
          <ListItem>
            <img
              src={graphActions}
              alt="Graph Node Actions"
              className="tutorial-central-image"
            />
          </ListItem>
          <ListItem>
            After clicking a graph node or link, you will see this actions ring
            appear, which will allow you to:
          </ListItem>
          <ListItem>
            <ListItemText inset primary="Expand the record to view its related records" />
          </ListItem>
          <ListItem>
            <ListItemText inset primary="Hide the record from the graph" />
          </ListItem>
          <ListItem>
            <ListItemText inset primary="View record details in a side drawer" />
          </ListItem>
        </List>
      </Paper>
    </div>
  );
}

export default TutorialView;
