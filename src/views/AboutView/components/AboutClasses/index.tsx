import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import {
  List,
  Typography,
} from '@material-ui/core';
import React from 'react';

import ClassDescription from './components/ClassDescription';

const AboutClasses = () => {
  const models = Object.values(schemaDefn.schema)
    .filter((m) => !m.embedded && !m.isAbstract && !m.isEdge)
    .sort((m1, m2) => m1.name.localeCompare(m2.name))
    .map((m) => ({ name: m.name, description: m.description }));

  const links = Object.values(schemaDefn.schema)
    .filter((m) => !m.embedded && !m.isAbstract && m.isEdge)
    .sort((m1, m2) => m1.name.localeCompare(m2.name))
    .map((m) => ({ name: m.name, description: m.description }));

  return (
    <div className="about-page__content">
      <Typography variant="h1">
        Record Classes
      </Typography>
      <Typography paragraph>
        There are a number of record class types that exist in GraphKB. Descriptions of select classes can be found below
      </Typography>
      <List>
        {models.map(ClassDescription)}
      </List>

      <Typography variant="h2">
        Relationship (Edge) Classes
      </Typography>
      <Typography paragraph>
        Relationship classes are types of edge records that can be used to relate records to one another
      </Typography>
      <List>
        {links.map(ClassDescription)}
      </List>
    </div>
  );
};

export default AboutClasses;
