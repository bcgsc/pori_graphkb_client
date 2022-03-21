import {
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import React from 'react';

const AboutStatements = () => (
  <>
    <Typography variant="h2">
      Statement Examples
    </Typography>
    <Typography paragraph>
      Somtimes it can be confusing how to decompose the content you want to enter into a statement.
      There are recurring type of statements being entered, we will go through examples of some of
      these types in detail below.
    </Typography>
    <Typography paragraph>
      Before a statement can be entered, all of the elements of the statement must first exist so that
      they can be linked to. In most cases the required elements (variants, therapies, vocabulary, etc.)
      will already exist. However if they do not, they should be created prior to attempting to input the statement.
    </Typography>
    <Typography variant="h3">
      Eligibility for a Clinical Trial
    </Typography>
    <Typography>
      For this example we are attempting to input the following. There is a clinical trial with the trial
      id NCT0444444 (Fictional trial ID). This trial requires participants to have mutations in the gene EGFR for Eligibility.
      It also requires the patients to be diagnosed with Lung Adenocarcinoma. Decomposed this becomes

      <ListItem>
        <ListItemText
          primary="subject"
          secondary="NCT0444444: Here 'Eligibility' applies to the clinical trial 'NCT0444444'"
        />
      </ListItem>
      <ListItem>
        <ListItemText
          primary="Relevance"
          secondary="Eligibility: The purpose or relevance of this statement is 'Eligibility'. This is what we are trying to communicate"
        />
      </ListItem>
      <ListItem>
        <ListItemText
          primary="conditions"
          secondary="Lung Adenocarcinoma, and EGFR mutation: These are the conditions required"
        />
      </ListItem>
      <ListItem>
        <ListItemText
          primary="evidence"
          secondary="NCT0444444: Here the support is also the clinical trial since it is responsible for defining the eligibility requirements"
        />
      </ListItem>
    </Typography>
  </>
);

export default AboutStatements;
