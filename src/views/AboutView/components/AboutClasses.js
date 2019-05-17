import React, { Component } from 'react';
import {
  Typography,
  CircularProgress,
  ListItem,
  ListItemIcon,
  ListItemText,
  List,
} from '@material-ui/core';

import api from '../../../services/api';
import { KBContext } from '../../../components/KBContext';
import DetailChip from '../../../components/DetailChip';


class AboutClasses extends Component {
  static contextType = KBContext;

  constructor(props) {
    super(props);
    this.state = {
      stats: [{ label: '', value: 0 }], // so that the page doesn't wait to load
      examples: {},
    };
    this.controllers = [];
  }

  async componentDidMount() {
    const { auth } = this.context;
    if (auth.isAuthorized()) {
      this.getClassStats();
      this.getClassExamples();
    }
  }

  componentWillUnmount() {
    this.controllers.forEach(c => c.abort());
  }

  async getClassStats() {
    const call = api.get('/stats');
    this.controllers.push(call);

    const stats = await call.request();

    this.setState({
      stats: Array.from(
        Object.keys(stats),
        label => ({ label, value: stats[label] }),
      ),
    });
  }

  async getClassExample(model) {
    const call = api.get(`${model.routeName}?limit=1&neighbors=1`);
    this.controllers.push(call);
    const result = await call.request();
    if (result && result.length) {
      this.setState({ [`${model.name}-example`]: result[0] });
    }
  }

  getClassExamples() {
    const { schema } = this.context;

    Object.values(schema.schema)
      .filter(model => !model.isAbstract && !model.embedded)
      .map(model => this.getClassExample(model));
  }


  render() {
    const {
      stats,
    } = this.state;
    const { schema, auth } = this.context;

    const isAuthorized = auth.isAuthorized();

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

      const example = this.state[`${name}-example`];
      const count = countsByName[name];

      return (
        <React.Fragment key={name}>
          <ListItem>
            <ListItemIcon className="letter-icon">{
              isAuthorized
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
                && isAuthorized
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
        <Typography component="h2">
            Record Classes
        </Typography>
        <Typography paragraph>
            There are a number of record class types that exist in GraphKB. Descriptions of select classes can be found below
        </Typography>
        <List>
          {models.map(ClassDescription)}
        </List>

        <Typography component="h2">
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
  }
}

export default AboutClasses;
