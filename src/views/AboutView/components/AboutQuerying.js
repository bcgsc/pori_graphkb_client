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

import queryResults from '../../../static/images/table-view.png';


const AboutQuerying = () => (
  <div className="about-page__content">
    <Typography variant="h1" id="about-page__querying">
        Querying
    </Typography>
    <Typography paragraph variant="body2">
      There are 3 ways to query GraphKB. These can be found by clicking on the search icon in the left-hand side bar.
    </Typography>
    <List>
      <ListItem>
        <Link to="/query">
          <ListItemText primary="Quick Search" secondary="This is the simplest way to query. It is the main page view of this application and contains a single text box for input" />
        </Link>
      </ListItem>
      <ListItem>
        <Link to="/query-popular/gene">
          <ListItemText primary="Popular Search" secondary="These are pre-built 'advanced' queries which are commonly used by analysts exploring the database" />
        </Link>
      </ListItem>
      <ListItem>
        <Link to="/query-advanced">
          <ListItemText primary="Advanced Search" secondary="This view is for advanced users and lets the user build their own queries from scratch. New users should start with one of the other two query views" />
        </Link>
      </ListItem>
    </List>
    <Typography variant="h2" id="about-results-table">
      Viewing Results (Table)
    </Typography>
    <Typography>
      After sending a query, result records will be loaded into the Table view
    </Typography>
    <img src={queryResults} alt="Query Results" id="query-table-view" />
    <Typography paragraph>
      Clicking any row in table view will open the details panel. From the details panel you can
      view or edit the record in a new window
    </Typography>
    <Typography variant="h3">Configuring Table Options</Typography>
    <Typography paragraph>
      Clicking the top-right ellipsis to modify the visible columns or export the current table to a
      document
    </Typography>
  </div>
);

export default AboutQuerying;
