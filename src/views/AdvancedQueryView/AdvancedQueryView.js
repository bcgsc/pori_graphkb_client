import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
  InputAdornment,
  Paper,
  Snackbar,
} from '@material-ui/core/';
import HelpIcon from '@material-ui/icons/Help';
import * as qs from 'querystring';
import ResourceSelectComponent from '../../components/ResourceSelectComponent/ResourceSelectComponent';
import AutoSearchComponent from '../../components/AutoSearchComponent/AutoSearchComponent';
import api from '../../services/api';
import util from '../../services/util';
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
      && history.location.state.body
      && history.location.state.body.message
    ) {
      this.setState({ message: history.location.state.body.message });
    }

    const form = {};
    const schema = await api.getSchema();
    const ontologyTypes = [{ name: '', properties: null, route: 'ontologies' }];
    ontologyTypes.push(...api.getOntologies(schema));
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
          form[name] = name === 'name' ? (history.location.state || {}).name : defaultValue || '';
          break;
      }
    });
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
    const newNodeClass = e.target.value;
    const editableProps = (await api.getClass(newNodeClass)).properties;
    const { form } = this.state;
    editableProps.forEach((prop) => {
      const { name, type, defaultValue } = prop;
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
                InputProps={{
                  endAdornment: description && (
                    <InputAdornment position="end">
                      <Tooltip title={description}>
                        <HelpIcon color="primary" />
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </ListItem>
          );
        }
        // If type is a link to another record, must find that record in the
        // database and store its rid.

        // Decide which endpoint to query.
        let endpoint;
        if (linkedClass) {
          endpoint = schema[linkedClass].route.slice(1);
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
        <Paper elevation={4}>
          <List component="nav">
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
            {Object.keys(form)
              .filter(key => !key.includes('.'))
              .map(key => formatInputSection(key, form[key]))
            }
          </List>
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
