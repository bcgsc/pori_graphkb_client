import {
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import React from 'react';

import graphActions from '@/static/images/graph-actions.png';
// static content
import graphResults from '@/static/images/graph-view.png';

const AboutGraphView = () => (
  <>
    <Typography id="about-results-graph" variant="h2">
      Graph View
    </Typography>
    <Typography variant="body1">
      The Graph view can be used to view clusters of records and their
      relationships with eachother. Click and drag nodes with your mouse
      or finger, and open the Graph settings to change labels, coloring
      schemes, and physical behavior of the graph and its constituents.
    </Typography>
    <img
      alt="Graph"
      src={graphResults}
    />
    <Typography id="about-results-graph" variant="h3">
      Graph Node Actions
    </Typography>
    <Typography variant="body1">
      After clicking a graph node or link, you will see this actions ring
      appear, which will allow you to
    </Typography>
    <div className="about-page__column-image">
      <img
        alt="Graph Node Actions"
        src={graphActions}
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
  </>
);

export default AboutGraphView;
