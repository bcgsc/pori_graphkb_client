import {
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@material-ui/core';
import React, { useContext, useEffect, useState } from 'react';

import DetailChip from '@/components/DetailChip';
import useObject from '@/components/hooks/useObject';
import { KBContext } from '@/components/KBContext';
import api from '@/services/api';
import { isAuthorized } from '@/services/auth';
import schema from '@/services/schema';


const AboutClasses = () => {
  const context = useContext(KBContext);
  const [stats, setStats] = useState([]);
  const { content: examples, updateField: setExample } = useObject({});

  useEffect(() => {
    const controllers = [];

    const getClassStats = async () => {
      const call = api.get('/stats');
      controllers.push(call);

      const result = await call.request();

      if (result) {
        setStats(Array.from(
          Object.keys(result || {}),
          label => ({ label, value: result[label] }),
        ));
      }
    };

    const getClassExample = async (model) => {
      const call = api.post('/query', { target: model.name, limit: 1, neighbors: 1 });
      controllers.push(call);
      const result = await call.request();

      if (result && result.length) {
        setExample(`${model.name}-example`, result[0]);
      }
    };

    getClassStats();

    if (isAuthorized(context)) {
      Object.values(schema.schema)
        .filter(model => !model.isAbstract && !model.embedded)
        .map(model => getClassExample(model));
    }

    return () => {
      controllers.forEach(c => c.abort());
    };
  }, [context, setExample]);

  const models = Object.values(schema.schema)
    .filter(m => !m.embedded && !m.isAbstract && !m.isEdge)
    .sort((m1, m2) => m1.name.localeCompare(m2.name));

  const links = Object.values(schema.schema)
    .filter(m => !m.embedded && !m.isAbstract && m.isEdge)
    .sort((m1, m2) => m1.name.localeCompare(m2.name));

  const countsByName = {};
  stats.forEach(({ label, value }) => {
    if (value / 1000000 > 1) {
      countsByName[label] = `${Math.round(value / 1000000)}M`;
    } else if (value / 1000 > 1) {
      countsByName[label] = `${Math.round(value / 1000)}K`;
    } else {
      countsByName[label] = `${value}`;
    }
  });

  const ClassDescription = (model) => {
    const { name, description } = model;

    const example = examples[`${name}-example`];
    const count = countsByName[name];

    return (
      <React.Fragment key={name}>
        <ListItem>
          <ListItemIcon className="letter-icon">{
              isAuthorized(context)
                ? count
                : name.slice(0, 1)
            }
          </ListItemIcon>
          <ListItemText primary={name} secondary={description} />
        </ListItem>
        <ListItem>
          <ListItemText inset>
            {!example
                && count !== '0'
                && count !== ''
                && isAuthorized(context)
                && (<CircularProgress size={20} />)
              }
            {example && (
            <DetailChip
              className="record-autocomplete__chip record-autocomplete__chip--single"
              label={schema.getLabel(example)}
              details={example}
              valueToString={(value) => {
                if (Array.isArray(value)) {
                  return `Array(${value.length})`;
                } if (typeof value === 'object') {
                  return schema.getLabel(value);
                }
                return `${value}`;
              }}
            />
            )}
          </ListItemText>
        </ListItem>
      </React.Fragment>
    );
  };

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
