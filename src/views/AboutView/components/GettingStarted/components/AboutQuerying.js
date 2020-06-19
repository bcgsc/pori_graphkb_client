import {
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import React from 'react';
import {
  Link,
} from 'react-router-dom';

import queryResults from '@/static/images/table-view.png';


const AboutQuerying = () => (
  <>
    <Typography id="about-page__querying" variant="h2">
      Querying
    </Typography>
    <Typography paragraph variant="body2">
      There are 3 ways to query GraphKB. These can be found by clicking on the search icon in the left-hand side bar.
    </Typography>
    <List className="search-list">
      <ListItem>
        <Link to="/query">
          <ListItemText primary="Quick Search" />
        </Link>
      </ListItem>
      <ListItem>
        <Typography>This is the simplest way to query. It is the main page view of this application and contains a single text box for input</Typography>
      </ListItem>
      <ListItem>
        <Link to="/query-popular/gene">
          <ListItemText primary="Popular Search" />
        </Link>
      </ListItem>
      <ListItem>
        <Typography> {'These are pre-built \'advanced\' queries which are commonly used by analysts exploring the database'}</Typography>
      </ListItem>
      <ListItem>
        <Link to="/query-advanced">
          <ListItemText primary="Advanced Search" />
        </Link>
      </ListItem>
      <ListItem>
        <Typography>This view is for advanced users and lets the user build their own queries from scratch. New users should start with one of the other two query views</Typography>
      </ListItem>
    </List>
    <Typography id="about-results-table" variant="h3">
      Viewing Results (Table)
    </Typography>
    <Typography>
      After sending a query, result records will be loaded into the Table view
    </Typography>
    <img alt="Query Results" id="query-table-view" src={queryResults} />
    <Typography paragraph>
      Clicking any row in table view will open the details panel. From the details panel you can
      view or edit the record in a new window
    </Typography>
    <Typography variant="h4">Configuring Table Options</Typography>
    <Typography paragraph>
      Clicking the top-right ellipsis to modify the visible columns or export the current table to a
      document
    </Typography>
  </>
);

export default AboutQuerying;
