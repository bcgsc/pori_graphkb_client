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
import api from '../../services/api';
import util from '../../services/util';
import FormTemplater from '../../components/FormTemplater/FormTemplater';
import config from '../../config';

/**
 * View for in-depth database query building. Form submissions will route to
 * the data results route to display the returned data. Forms are dynamically
 * generated based off of the database schema.
 */
class AdvancedQueryView extends Component {
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
    const { history } = this.props;
    if (
      history.location
      && history.location.state
      && history.location.state.message
    ) {
      const { message, name } = history.location.state;
      this.setState({ message: `${name || ''}: ${message}` });
    }

    const schema = await api.getSchema();
    const ontologyTypes = [{ name: '', properties: null, route: 'ontologies' }];
    ontologyTypes.push(...api.getOntologies(schema));
    const editableProps = (util.getClass(ontologyTypes[0].name || 'Ontology', schema)).properties;
    editableProps.push(...config.ONTOLOGY_QUERY_PARAMS);
    const form = util.initModel({ '@class': ontologyTypes[0].name }, editableProps);
    form.subsets = '';
    this.setState({
      ontologyTypes,
      form,
      editableProps,
      schema,
    });
  }

  /**
   * Formats query string to be passed into url.
   */
  bundle() {
    const { form, editableProps } = this.state;
    const params = [{ name: '@class', type: 'string' }];
    params.push(...config.ONTOLOGY_QUERY_PARAMS);
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
   * @param {Event} e - Class selection event
   */
  async handleClassChange(e) {
    const { form, schema } = this.state;
    const newNodeClass = e.target.value;
    const editableProps = (util.getClass(newNodeClass || 'Ontology', schema)).properties;
    editableProps.forEach((prop) => {
      const { name, type } = prop;
      const defaultValue = prop.default || '';
      if (form[name] === undefined) {
        if (type === 'boolean') {
          form[name] = defaultValue.toString() === 'true';
        } else {
          form[name] = '';
        }
      }
    });
    editableProps.push(...config.ONTOLOGY_QUERY_PARAMS);
    form['@class'] = e.target.value;
    this.setState({
      form,
      editableProps,
    });
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
      editableProps,
      message,
      schema,
    } = this.state;
    const { history } = this.props;

    if (!form) return null;

    const sortFields = (a, b) => {
      const order = [
        'name',
        'sourceId',
        'source',
        'subsets',
      ];
      if (order.indexOf(b.name) === -1) {
        return -1;
      }
      if (order.indexOf(a.name) === -1) {
        return 1;
      }
      if (order.indexOf(a.name) < order.indexOf(b.name)) {
        return -1;
      }
      return 1;
    };

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
          <Typography variant="headline" id="adv-title">
            Advanced Query
          </Typography>
        </Paper>
        <Paper elevation={4} className="adv-grid paper">
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
                  {resource.name ? resource.name : '---'}
                </MenuItem>
              )}
            </ResourceSelectComponent>
          </ListItem>
          <FormTemplater
            model={form}
            kbClass={editableProps}
            onChange={this.handleChange}
            schema={schema}
            sort={sortFields}
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
            variant="raised"
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

AdvancedQueryView.propTypes = {
  /**
   * @param {object} history - Application history state object.
   */
  history: PropTypes.object.isRequired,
};

export default AdvancedQueryView;
