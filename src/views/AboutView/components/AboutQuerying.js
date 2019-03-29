import React from 'react';
import {
  Link,
} from 'react-router-dom';
import {
  Typography,
  ListItem,
  List,
  ListItemText,
} from '@material-ui/core';

import queryResults from '../../../static/tutorial/table-view.png';


const AboutQuerying = () => (
  <div className="about-page__content">
    <Typography variant="h5" component="h2" id="about-page__querying">
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
    <Typography variant="h6" component="h2" paragraph id="about-results-table">
        Viewing Results (Table)
    </Typography>
    <Typography>
      After sending a query, result records will be loaded into the&nbsp;
      <Link to="/data/table?class=Statement">Table view</Link>
    </Typography>
    <img src={queryResults} alt="Query Results" id="query-table-view" />
    <List style={{ width: 'min-content' }}>
      <ListItem>
        <ListItemText primary="1. Filter" secondary="Filters are added using the advanced search form which pops up when you click this button" />
      </ListItem>
      <ListItem>
        <ListItemText primary="2. Options" secondary="Configure the visible columns and export data" />
      </ListItem>
      <ListItem>
        <ListItemText primary="3. Row" secondary="Click records to view details in a side drawer" />
      </ListItem>
      <ListItem>
        <ListItemText primary="4. Edit" secondary="Click the Edit Icon in the detail drawer to edit the current row" />
      </ListItem>
      <ListItem>
        <ListItemText primary="5. New Tab" secondary="Click this Icon to open the current row in a new Tab" />
      </ListItem>
      <ListItem>
        <ListItemText primary="6. Close" secondary="Click this Icon to close the detail side bar" />
      </ListItem>
    </List>
  </div>
);

export default AboutQuerying;
