import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import './AdvancedQueryView.css';
import {
  TextField,
  Button,
  Typography,
  MenuItem,
  List,
  ListItem,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  Tooltip,
} from '@material-ui/core/';
import HelpIcon from '@material-ui/icons/Help';
import queryString from 'query-string';
import ResourceSelectComponent from '../../components/ResourceSelectComponent/ResourceSelectComponent';
import AutoSearchComponent from '../../components/AutoSearchComponent/AutoSearchComponent';
import api from '../../services/api';
import util from '../../services/util';
import config from '../../config';

/**
 * View for in-depth database query building. Form submissions will route to
 * the data results route to display the returned data.
 */
class AdvancedQueryView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      form: null,
      ontologyTypes: [],
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleClassChange = this.handleClassChange.bind(this);
    this.bundle = this.bundle.bind(this);
  }

  /**
   * Initializes valid sources.
   */
  async componentDidMount() {
    const { history } = this.props;
    const form = {};
    const ontologyTypes = [{ name: '', properties: null }];
    const schemaVertices = await api.getOntologyVertices()
      .catch((error) => {
        if (error.status === 401) {
          history.push('/login');
        } else {
          history.push({ pathname: '/error', state: error });
        }
      });
    ontologyTypes.push(...schemaVertices);
    form['@class'] = ontologyTypes[0].name;

    const editableProps = (await api.getClass(form['@class'])).properties;
    editableProps.push(...config.ONTOLOGY_QUERY_PARAMS);
    editableProps.forEach((prop) => {
      const {
        name,
        type,
        linkedClass,
        defaultValue,
      } = prop;
      switch (type) {
        case 'link':
          form[`${name}.@rid`] = '';
          form[name] = '';

          if (!linkedClass) {
            form[`${name}.class`] = '';
          }
          form[`${name}.sourceId`] = '';

          break;
        case 'boolean':
          form[name] = defaultValue.toString() === 'true';
          break;
        default:
          form[name] = name === 'name' ? history.location.state.name : defaultValue || '';
          break;
      }
    });

    this.setState({
      ontologyTypes,
      form,
      editableProps,
    });
  }

  /**
   * Re renders form input fields based on class editable properties.
   * @param {Event} e - Class selection event
   */
  async handleClassChange(e) {
    const newNodeClass = e.target.value;
    const editableProps = (await api.getClass(newNodeClass)).properties;
    const { form } = this.state;
    editableProps.forEach((prop) => {
      const { name } = prop;
      if (!form[name]) {
        form[name] = '';
      }
    });
    form['@class'] = e.target.value;
    this.setState({
      form,
      editableProps,
    });
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
   * Formats query string to be passed into url.
   */
  bundle() {
    const { form, editableProps } = this.state;
    const params = [{ name: '@class', type: 'string' }];
    params.push(...config.ONTOLOGY_QUERY_PARAMS);
    const payload = util.parsePayload(form, editableProps, params);

    return queryString.stringify(payload);
  }

  render() {
    const {
      form,
      ontologyTypes,
      editableProps,
    } = this.state;

    if (!form) return null;

    const formatInputSection = (key, value) => {
      const property = editableProps.find(prop => prop.name === key);
      if (!property) return null;

      const {
        type,
        linkedClass,
        description,
      } = property;
      if (typeof value !== 'object') {
        // Radio group component for boolean types.
        if (type === 'boolean') {
          return (
            <ListItem className="input-wrapper" key={key}>
              <FormControl component="fieldset">
                <FormLabel>
                  {util.antiCamelCase(key)}
                </FormLabel>
                <RadioGroup
                  name={key}
                  onChange={this.handleChange}
                  value={value.toString()}
                  style={{ flexDirection: 'row' }}
                >
                  <FormControlLabel value="true" control={<Radio />} label="Yes" />
                  <FormControlLabel value="false" control={<Radio />} label="No" />
                </RadioGroup>
              </FormControl>
            </ListItem>
          );
        }

        // For text fields, apply some final changes for number inputs.
        if (type !== 'link') {
          let t;
          let step;
          if (type === 'string') {
            t = 'text';
          } else if (type === 'integer' || type === 'long') {
            t = 'number';
            step = 1;
          }

          return (
            <ListItem className="input-wrapper" key={key}>
              <TextField
                id={key}
                label={util.antiCamelCase(key)}
                value={value}
                onChange={this.handleChange}
                className="text-input"
                name={key}
                type={t || ''}
                step={step || ''}
                multiline={t === 'text'}
              />
              {description ? (
                <Tooltip title={description}>
                  <HelpIcon color="primary" />
                </Tooltip>
              ) : null}
            </ListItem>
          );
        }
        // If type is a link to another record, must find that record in the
        // database and store its rid.

        // Decide which endpoint to query.
        let endpoint;
        if (linkedClass) {
          endpoint = util.pluralize(linkedClass);
        } else {
          endpoint = 'ontologies';
        }

        return (
          <ListItem key={key} style={{ display: 'block' }}>
            <div>
              <AutoSearchComponent
                value={value}
                onChange={this.handleChange}
                name={key}
                label={util.antiCamelCase(key)}
                id={key}
                limit={30}
                endpoint={endpoint}
                property={!linkedClass ? ['name', 'sourceId'] : undefined}
              />
            </div>
          </ListItem>
        );
      }
      if (Array.isArray(value)) {
        return null;
      }
      return null;
    };

    return (
      <div className="adv-wrapper">
        <Typography color="textSecondary" variant="headline" id="adv-title">
          Advanced Query
        </Typography>
        <div className="endpoint-selection">
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
                {resource.name}
              </MenuItem>
            )}
          </ResourceSelectComponent>
        </div>
        <List component="nav">
          {Object.keys(form)
            .filter(key => !key.includes('.'))
            .map(key => formatInputSection(key, form[key]))
          }
        </List>
        <div id="adv-nav-buttons">
          <Link to={{ state: this.state, pathname: '/query' }}>
            <Button variant="outlined" color="secondary">
              Back
            </Button>
          </Link>
          <Link to={{ search: this.bundle(), pathname: '/data/table' }}>
            <Button color="primary" variant="raised" id="search-button">
              Search
            </Button>
          </Link>
        </div>
      </div>
    );
  }
}

/**
 * @param {object} history - Application history state object.
 */
AdvancedQueryView.propTypes = {
  history: PropTypes.object.isRequired,
};

export default AdvancedQueryView;
