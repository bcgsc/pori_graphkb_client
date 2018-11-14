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
  Snackbar,
} from '@material-ui/core/';
import * as qs from 'querystring';
import ResourceSelectComponent from '../../components/ResourceSelectComponent/ResourceSelectComponent';
import util from '../../services/util';
import FormTemplater from '../../components/FormTemplater/FormTemplater';
import config from '../../static/config';
import { withSchema } from '../../components/SchemaContext/SchemaContext';

const DEFAULT_ORDER = [
  'name',
  'sourceId',
  'source',
  'subsets',
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
      classes: [],
      message: '',
    };

    this.bundle = this.bundle.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleClassChange = this.handleClassChange.bind(this);
    this.handleNestedClassChange = this.handleNestedClassChange.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  /**
   * Initializes valid sources.
   */
  async componentDidMount() {
    const { history, schema } = this.props;
    if (
      history.location
      && history.location.state
      && history.location.state.message
    ) {
      const { message, name } = history.location.state;
      this.setState({ message: `${name || ''}: ${message}` });
    }

    const classes = [];
    classes.push(...schema.getOntologies());
    classes.push(...schema.getVariants());

    const form = schema.initModel({}, 'Ontology', config.ONTOLOGY_QUERY_PARAMS);

    this.setState({
      classes,
      form,
    });
  }

  /**
   * Formats query string to be passed into url.
   */
  bundle() {
    const { form } = this.state;
    const { schema } = this.props;
    const params = [{ name: '@class', type: 'string' }];
    params.push(...config.ONTOLOGY_QUERY_PARAMS);
    const schemaClass = schema.getClass(form['@class']).properties || [];
    schemaClass.push(...config.ONTOLOGY_QUERY_PARAMS);
    const payload = util.parsePayload(form, schemaClass, params, true);
    return qs.stringify(payload);
  }

  /**
   * Updates main parameters after user input.
   * @param {Event} e - User input event.
   */
  handleChange(e, nested) {
    const { form } = this.state;
    const {
      name,
      value,
      '@rid': rid,
      sourceId,
    } = e.target;

    if (nested) {
      form[nested][name] = value;
      form[nested][`${name}.@rid`] = rid || '';
      form[nested][`${name}.sourceId`] = sourceId || '';
    } else {
      form[name] = value;
      form[`${name}.@rid`] = rid || '';
      form[`${name}.sourceId`] = sourceId || '';
    }

    this.setState({ form });
  }


  /**
   * Re renders form input fields based on class editable properties.
   * @param {Event} e - User class selection event.
   */
  async handleClassChange(e) {
    const { form } = this.state;
    const { schema } = this.props;
    const newForm = schema.initModel(form, e.target.value || 'Ontology', config.ONTOLOGY_QUERY_PARAMS);
    this.setState({ form: newForm });
  }

  /**
 * Handles changes in an embedded property's class.
 * @param {Event} e - new class selection event.
 * @param {string} nested - nested property key.
 */
  handleNestedClassChange(e, nested) {
    const { form } = this.state;
    const { schema } = this.props;
    const { value } = e.target;
    const classSchema = schema.getClass(form['@class']).properties;
    if (schema.getClass(value)) {
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

  /**
   * Closes notification snackbar.
   */
  handleClose() {
    this.setState({ message: '' });
  }

  render() {
    const {
      form,
      classes,
      message,
    } = this.state;
    const { history, schema } = this.props;

    if (!form) return null;
    const props = schema.getClass(form['@class']).properties || [];
    props.push(...config.ONTOLOGY_QUERY_PARAMS);

    return (
      <div className="adv-wrapper" elevation={4}>
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={!!message}
          onClose={this.handleClose}
          autoHideDuration={3000}
          message={(
            <span>
              {message}
            </span>
          )}
        />
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
              resources={classes}
            >
              {resource => (
                <MenuItem key={resource.name} value={resource.name}>
                  {resource.name ? util.antiCamelCase(resource.name) : '---'}
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
          />
        </Paper>
        <Paper elevation={4} id="adv-nav-buttons">
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => history.push({ pathname: '/query', state: this.state })}
            size="large"
          >
            Back
          </Button>
          <Button
            color="primary"
            variant="contained"
            id="search-button"
            onClick={() => history.push({
              pathname: '/data/table',
              search: this.bundle(),
            })}
            size="large"
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

const AdvancedQueryView = withSchema(AdvancedQueryViewBase);

/**
 * Export consumer component and regular component for testing.
 */
export {
  AdvancedQueryView,
  AdvancedQueryViewBase,
};
