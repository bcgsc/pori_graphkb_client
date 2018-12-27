import React from 'react';

import {
  Link,
} from 'react-router-dom';
import {
  Typography,
} from '@material-ui/core';


import config from '../../../static/config';

const { API_BASE_URL } = config;


const AboutQuerying = () => (
  <div>
    <Typography variant="h5" component="h2" id="about-querying">
        Querying
    </Typography>
    <Typography paragraph>
        To query GraphKB using this GUI, navigate to the&nbsp;
      <Link to="/query">Query</Link> page by using the navbar on the left. To query
        using this page, simply type into the search bars and hit enter or
        click on the search icon on the right.
    </Typography>
    <Typography paragraph>
        To access the <Link to="/query/advanced">Advanced Query</Link> page, click on the labelled
        button. The Advanced Query page allows more specific queries to be
        made to the database. The first thing to do when building a query is
        to choose a record class. The dropdown contains a list of classes to choose
        from, and in doing so, you will change the available form fields to
        fill out, as certain classes have different properties than others.
    </Typography>
    <Typography paragraph>
        If you wish for more control over your query, the&nbsp;
      <Link to="/query/advanced/builder">Query Builder</Link> page
        removes all guides and lets you send whatever queries you want to the
        database. Navigate from the Advanced Query page by clicking the
        button in the top right corner. It is recommended for beginners to
        read the GraphKB specification to better understand the classes and
        the different querying features. Queries made by the Query Builder
        follow the complex POST query syntax, which can be found&nbsp;
      <a href={`${API_BASE_URL}/spec`} rel="noopener noreferrer" target="_blank">here</a>.
    </Typography>
  </div>
);

export default AboutQuerying;
