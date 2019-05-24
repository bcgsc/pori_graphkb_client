import React from 'react';
import {
  Typography,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import { Link } from 'react-router-dom';


const AboutStatements = () => (
  <div className="about-page__content">
    <Typography variant="h2">
        Statements
    </Typography>
    <Typography paragraph>
      Statements make up most of the interpretive content of GraphKB. Statements are decomposed sentences
      which link conditions to a conclusion.There are four main elements to a
      statement.&nbsp;
      <Link to="/data/table?class=Statement">
        Jump to the statements table view&nbsp;
      </Link>
      to look through examples of entered statements
    </Typography>
    <List>
      <ListItem>
        <ListItemText
          primary="AppliesTo"
          secondary="This is the element which the relevance of the statement applies to"
        />
      </ListItem>
      <ListItem>
        <ListItemText
          primary="Relevance"
          secondary="This adds meaning to a statement and applies to the previous element"
        />
      </ListItem>
      <ListItem>
        <ListItemText
          primary="ImpliedBy"
          secondary="This is the statement context. It is a series of required conditions for the statement to be applicable/true"
        />
      </ListItem>
      <ListItem>
        <ListItemText
          primary="SupportedBy"
          secondary="One or more pieces of evidence (Literature, DB, etc) which support this statement"
        />
      </ListItem>
    </List>
    <Typography paragraph>
      Somtimes it can be confusing how to decompose the content you want to enter into a statement.
      Since there are recurring examples of statements being entered, we will go through some in
      detail below.
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
          primary="AppliesTo"
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
          primary="ImpliedBy"
          secondary="Lung Adenocarcinoma, and EGFR mutation: These are the conditions required"
        />
      </ListItem>
      <ListItem>
        <ListItemText
          primary="SupportedBy"
          secondary="NCT0444444: Here the support is also the clinical trial since it is responsible for defining the eligibility requirements"
        />
      </ListItem>
    </Typography>
  </div>
);

export default AboutStatements;
