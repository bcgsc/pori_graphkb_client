import './index.scss';

import {
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import React from 'react';
import { Link } from 'react-router-dom';
import slugify from 'slugify';

import TableOfContents from '../TableOfContents';
import AboutForms from './components/AboutForms';
import AboutGraphView from './components/AboutGraphView';
import AboutQuerying from './components/AboutQuerying';
import AboutStatements from './components/AboutStatements';

const GettingStarted = () => {
  const sections = [
    'Welcome',
    'Core Concepts',
    'Statement Examples',
    'Querying',
    'Adding Data',
    'Graph View',
  ].map(label => ({ id: slugify(label).toLowerCase(), label }));

  return (
    <div className="about-page__content getting-started">
      <TableOfContents baseRoute="about/getting-started" sections={sections} />
      <Card className="getting-started__card" elevation={3} id="welcome">
        <CardContent>
          <Typography variant="h2">Welcome to GraphKB</Typography>
          <Typography variant="body1">
            If you are a new User there are a couple things to do to get started. You will
            need to sign the end user license agreement in the terms Card&nbsp;
            <Link to="/about/terms">here</Link>.
            Once you have signed, you will be able to query GraphKB using this interface of
            the API. Next you should read through the sections below.
          </Typography>
        </CardContent>
      </Card>
      <Card className="getting-started__card" elevation={3} id="core-concepts">
        <Typography variant="h2">Core Concepts</Typography>
        <Typography variant="body1">
          There are 3 main data types in GraphKB: Statements, Ontologies, and Variants.
        </Typography>
        <Typography variant="h3">Statements</Typography>
        <Typography variant="body1">
          Statements are used to represent the interpretive content or assertions.
          Statements make up most of the interpretive content of GraphKB. Statements are
          decomposed sentences which link conditions to a conclusion. There are four main
          elements to a statement
        </Typography>
        <img alt="Statement Schema" src={`${window._env_.API_BASE_URL}/public/pori-statement-schema.svg`} />
        <List>
          <ListItem>
            <ListItemText
              primary="Subject"
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
              primary="Conditions"
              secondary="This is the statement context. It is a series of required conditions for the statement to be applicable/true"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Evidence"
              secondary="One or more pieces of evidence (Literature, DB, etc) which support this statement"
            />
          </ListItem>
        </List>
        <Typography variant="h3">Variants</Typography>
        <Typography variant="body1">
          Variants can be the well known small mutations (KRAS:p.G12D), fusions, signature
          variants, expression variants, copy variants, etc. Variant Records are composed of three
          key attributes: reference1, reference2, and type. All of these are foreign keys to an
          ontology record. Most often reference1/2 are genes and type is a Vocabulary record.
        </Typography>
        <img alt="Variant Schema" src={`${window._env_.API_BASE_URL}/public/pori-positional-variant-schema.svg`} />
        <List>
          <ListItem>
            <ListItemText
              primary="reference1"
              secondary="the reference element this variant is defined with respect to. Most often a gene"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="reference2"
              secondary="reference2 is only used for fusions and structural variants"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="type"
              secondary="This is the class this variant belongs to (ex. indel)"
            />
          </ListItem>
        </List>
        <Typography variant="h3">Ontology Terms</Typography>
        <Typography variant="body1">
          Ontologies can be used to represent any set of controlled vocabulary. Important features
          of an ontology record in GraphKB are
        </Typography>
        <img alt="Ontology Schema" src={`${window._env_.API_BASE_URL}/public/pori-ontology-schema.svg`} />
        <List>
          <ListItem>
            <ListItemText primary="source" secondary="This is the database or external collection that defines this record (ex. PubMed)" />
          </ListItem>
          <ListItem>
            <ListItemText primary="sourceId" secondary="This is the ID for this record as defined by its source definition (ex. PMID:1234). This is essential for tracibility or records" />
          </ListItem>
          <ListItem>
            <ListItemText primary="name" secondary="The name is generally the longer form and more human readable form to represent this record. However it can be the same as the sourceId when no other name has been attributed" />
          </ListItem>
          <ListItem>
            <ListItemText primary="description" secondary="The definition of the ontology term" />
          </ListItem>
        </List>
      </Card>
      <Card className="getting-started__card" elevation={3} id="statement-examples">
        <AboutStatements />
      </Card>
      <Card className="getting-started__card" elevation={3} id="querying">
        <AboutQuerying />
      </Card>
      <Card className="getting-started__card" elevation={3} id="adding-data">
        <AboutForms />
      </Card>
      <Card className="getting-started__card" elevation={3} id="graph-view">
        <AboutGraphView />
      </Card>
    </div>
  );
};

export default GettingStarted;
