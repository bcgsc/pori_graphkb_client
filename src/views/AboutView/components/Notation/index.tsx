import './index.scss';

import {
  List, ListItem, ListItemText, Typography,
} from '@material-ui/core';
import React from 'react';

import NotationParser from './components/NotationParser';

const AboutNotation = () => (
  <div className="about-page__content about-notation">
    <Typography variant="h2">Positional Variant Notation in GraphKB</Typography>
    <Typography variant="body1">
      Positional variants in GraphKB use notation that is an extended form
      of&nbsp;<a href="https://varnomen.hgvs.org/">HGVS</a>. The traditional
      HGVS notation has been extended to support additional types and coordinate systems (ex. cytoband positions,
      exon numbers, etc.). The parser is implemented as a separate node package, further documentation
      on the parser and the notation it supports can be found with the&nbsp;
      <a href="https://github.com/bcgsc/pori_graphkb_parser">repository</a>
      &nbsp;for that package
    </Typography>
    <Typography variant="body1">
      You can test out the parser below to see how it processes notation and to check if certain
      notation is valid
    </Typography>
    <NotationParser />
    <Typography variant="h3">Examples</Typography>
    <Typography variant="body1">Some examples of non-standard HGVS notation supported by the GraphKB parser are given below</Typography>
    <List>
      <ListItem>
        <ListItemText
          primary="(EWSR1,FLI1):fusion(e.1,e.2)"
          secondary="A fusion of exon 1 of EWSR1 to exon2 of FLI1"
        />
      </ListItem>
      <ListItem>
        <ListItemText
          primary="14:y.q12.1_q12.2del"
          secondary="deletion of the cytoband section on chromosome 14, arm Q major band 12 minor bands 1 and 2"
        />
      </ListItem>
    </List>
  </div>
);

export default AboutNotation;
