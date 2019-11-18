import React from 'react';

import {
  Typography,
  ListItem,
  List,
  ListItemText,

} from '@material-ui/core';

// static content
import graphResults from '@/static/images/graph-view.png';
import graphActions from '@/static/images/graph-actions.png';


const AboutGraphView = () => (
  <div className="about-page__content">
    <Typography variant="h1" id="about-results-graph">
        Graph View
    </Typography>
    <Typography variant="body1">
      The Graph view can be used to view clusters of records and their
      relationships with eachother. Click and drag nodes with your mouse
      or finger, and open the Graph settings to change labels, coloring
      schemes, and physical behavior of the graph and its constituents.
    </Typography>
    <img
      src={graphResults}
      alt="Graph"
    />
    <Typography variant="h2" id="about-results-graph">
        Graph Node Actions
    </Typography>
    <Typography variant="body1">
        After clicking a graph node or link, you will see this actions ring
        appear, which will allow you to
    </Typography>
    <div className="about-page__column-image">
      <img
        src={graphActions}
        alt="Graph Node Actions"
      />
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
    </div>
  </div>
);

export default AboutGraphView;
