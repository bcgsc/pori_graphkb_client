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
import { withSchema } from '../../services/SchemaContext';

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
      ontologyTypes: [],
      message: '',
    };

    this.bundle = this.bundle.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleClassChange = this.handleClassChange.bind(this);
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

    const ontologyTypes = [{ name: 'Ontology', properties: null, route: 'ontologies' }];
    ontologyTypes.push(...util.getOntologies(schema));

    const form = util.initModel({}, 'Ontology', schema, config.ONTOLOGY_QUERY_PARAMS);
    form.subsets = '';

    this.setState({
      ontologyTypes,
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
    const editableProps = util.getClass(form['@class'], schema).properties || [];
    editableProps.push(...config.ONTOLOGY_QUERY_PARAMS);
    const payload = util.parsePayload(form, editableProps, params);
    return qs.stringify(payload);
  }

  /**
   * Updates main parameters after user input.
   * @param {Event} e - User input event.
   */
  handleChange(e) {
    const { form } = this.state;
    form[e.target.name] = e.target.value;

    if (e.target['@rid']) {
      form[`${e.target.name}.@rid`] = e.target['@rid'];
    } else if (form[`${e.target.name}.@rid`]) {
      form[`${e.target.name}.@rid`] = '';
    }
    if (e.target.sourceId) {
      form[`${e.target.name}.sourceId`] = e.target.sourceId;
    } else if (form[`${e.target.name}.sourceId`]) {
      form[`${e.target.name}.sourceId`] = '';
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
    const newForm = util.initModel(form, e.target.value || 'Ontology', schema, config.ONTOLOGY_QUERY_PARAMS);
    newForm.subsets = Array.isArray(newForm.subsets) ? newForm.subsets.join('') : newForm.subsets || '';
    this.setState({ form: newForm });
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
      ontologyTypes,
      message,
    } = this.state;
    const { history, schema } = this.props;

    if (!form) return null;

    const editableProps = (util.getClass(form['@class'], schema)).properties || [];
    editableProps.push(...config.ONTOLOGY_QUERY_PARAMS);

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
              resources={ontologyTypes}
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
            kbClass={editableProps}
            onChange={this.handleChange}
            schema={schema}
            sort={util.sortFields(DEFAULT_ORDER)}
            ignoreRequired
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
