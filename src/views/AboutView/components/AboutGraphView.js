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

// static content
import graphResults from '../../../static/tutorial/graph-tutorial.png';
import graphActions from '../../../static/tutorial/graph-actions.png';


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

export default AboutGraphView;
