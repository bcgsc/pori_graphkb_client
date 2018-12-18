/**
 * @module /views/AdvancedQueryView
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './AdvancedQueryView.css';
import {
  Button,
  Typography,
  MenuItem,
  ListItem,
  Paper,
} from '@material-ui/core/';
import * as qs from 'querystring';
import FormTemplater from '../../components/FormTemplater';
import { withKB } from '../../components/KBContext';
import ResourceSelectComponent from '../../components/ResourceSelectComponent';
import { SnackbarContext } from '../../components/Snackbar';
import util from '../../services/util';
import auth from '../../services/auth';
import config from '../../static/config';

const DEFAULT_ORDER = [
  'name',
  'sourceId',
  'source',
  'subsets',
  'type',
  'reference1',
  'reference2',
  'break1Start',
  'break1End',
  'break2Start',
  'break2End',
  'relevance',
  'appliesTo',
];

/**
 * View for in-depth database query building. Form submissions will route to
 * the data results route to display the returned data. Forms are dynamically
 * generated based off of the database schema.
 */
class AdvancedQueryViewBase extends Component {
  constructor(props) {
    super(props);

    this.state = {
      form: null,
    };

    this.bundle = this.bundle.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleClassChange = this.handleClassChange.bind(this);
    this.handleNestedClassChange = this.handleNestedClassChange.bind(this);
  }

  /**
   * Initializes valid sources.
   */
  async componentDidMount() {
    const { history, schema } = this.props;
    const snackbar = this.context;
    if (
      history.location
      && history.location.state
    ) {
      const { message, name } = history.location.state;
      snackbar.add(`${name || 'Error'}: ${message || 'Bad Request'}`);
    }

    const form = schema.initModel({}, 'Ontology', {
      extraProps: config.ONTOLOGY_QUERY_PARAMS,
      isQuery: true,
    });

    this.setState({ form });
  }

  /**
   * Formats query string to be passed into url.
   */
  bundle() {
    const { form } = this.state;
    const { schema } = this.props;
    const params = ['@class'];
    const properties = schema.getQueryProperties(form['@class']) || [];
    properties.push(...config.ONTOLOGY_QUERY_PARAMS);
    const payload = util.parsePayload(form, properties, params, true);
    return qs.stringify(payload);
  }

  /**
   * Updates main parameters after user input.
   * @param {Event} event - User input event.
   */
  handleChange(event, nested) {
    const { form } = this.state;
    const { schema } = this.props;
    const {
      name,
      value,
    } = event.target;

    if (nested) {
      form[nested][name] = value;
      if (name.includes('.data') && value) {
        form[nested][name.split('.')[0]] = schema.getPreview(value);
      }
    } else {
      form[name] = value;
      if (name.includes('.data') && value) {
        form[name.split('.')[0]] = schema.getPreview(value);
      }
    }

    this.setState({ form });
  }


  /**
   * Re renders form input fields based on class editable properties.
   * @param {Event} event - User class selection event.
   */
  async handleClassChange(event) {
    const { form } = this.state;
    const { schema } = this.props;
    const newForm = schema.initModel(form, event.target.value || 'Ontology', {
      extraProps: config.ONTOLOGY_QUERY_PARAMS,
      isQuery: true,
    });
    this.setState({ form: newForm });
  }

  /**
   * Handles changes in an embedded property's class.
   * @param {Event} event - new class selection event.
   * @param {string} nested - nested property key.
   */
  handleNestedClassChange(event, nested) {
    const { form } = this.state;
    const { schema } = this.props;
    const { value } = event.target;
    const classSchema = schema.getProperties(form);
    if (schema.getProperties(value)) {
      const abstractClass = classSchema
        .find(p => p.name === nested).linkedClass.name;
      const varKeys = classSchema
        .filter(p => p.linkedClass && p.linkedClass.name === abstractClass)
        .map(p => p.name);
      varKeys.forEach((key) => {
        if ((form[key]['@class'] && form[key]['@class'] !== value) || key === nested) {
          form[key] = schema.initModel({}, value);
        }
      });
    } else {
      form[nested] = { '@class': '' };
    }
    this.setState({ form });
  }

  render() {
    const {
      form,
    } = this.state;
    const { history, schema } = this.props;

    if (!form) return null;
    const props = schema.getQueryProperties(form['@class']) || [];
    props.push(...config.ONTOLOGY_QUERY_PARAMS);

    return (
      <div className="adv-wrapper" elevation={4}>
        <Paper elevation={4} className="adv-header">
          <Button
            onClick={() => history.push('/query/advanced/builder')}
            variant="outlined"
          >
            Query Builder
          </Button>
          <Typography variant="h5" id="adv-title">
            Advanced Query
          </Typography>
        </Paper>
        <Paper elevation={4} className="adv-grid">
          <ListItem className="input-wrapper">
            <ResourceSelectComponent
              value={form['@class']}
              onChange={this.handleClassChange}
              name="@class"
              label="Class"
              id="class-adv"
              resources={schema.getQueryable(auth.isAdmin())}
            >
              {resource => (
                <MenuItem key={resource.name} value={resource.name}>
                  {resource.name || '---'}
                </MenuItem>
              )}
            </ResourceSelectComponent>
          </ListItem>
          <FormTemplater
            model={form}
            propSchemas={props}
            onChange={this.handleChange}
            schema={schema}
            sort={util.sortFields(DEFAULT_ORDER)}
            ignoreRequired
            onClassChange={this.handleNestedClassChange}
            disableLists // TODO: update once list syntax is defined
            pairs={{
              range: ['start', 'end'],
              sourceId: ['sourceId', 'sourceIdVersion'],
              trialRange: ['startYear', 'completionYear'],
              location: ['country', 'city'],
            }}
          />
        </Paper>
        <Paper elevation={4} id="adv-nav-buttons">
          <Button
            color="secondary"
            variant="outlined"
            size="large"
            onClick={() => history.push({ pathname: '/query' })}
          >
            Back
          </Button>
          <Button
            color="primary"
            variant="contained"
            size="large"
            id="search-button"
            onClick={() => history.push({
              pathname: '/data/table',
              search: this.bundle(),
            })}
          >
            Search
          </Button>
        </Paper>
      </div>
    );
  }
}

/**
 * @namespace
 * @property {Object} history - Application history state object.
 * @property {Object} schema - Knowledgebase schema object.
 */
AdvancedQueryViewBase.propTypes = {
  history: PropTypes.object.isRequired,
  schema: PropTypes.object.isRequired,
};

AdvancedQueryViewBase.contextType = SnackbarContext;

const AdvancedQueryView = withKB(AdvancedQueryViewBase);

/**
 * Export consumer component and regular component for testing.
 */
export {
  AdvancedQueryView,
  AdvancedQueryViewBase,
};
