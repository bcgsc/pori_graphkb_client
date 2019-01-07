import React from 'react';
import {
  Typography,
  ListItem,
  List,
  ListItemText,

} from '@material-ui/core';
import {
  Link,
} from 'react-router-dom';


import queryResults from '../../../static/tutorial/table-tutorial.png';


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


export default AboutTableView;
