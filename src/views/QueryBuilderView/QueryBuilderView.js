/**
 * @module /views/QueryBuilderView
 */
/* eslint-disable no-unused-vars */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './QueryBuilderView.css';
import {
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  Paper,
  Typography,
  Switch,
  Collapse,
  MenuItem,
} from '@material-ui/core';
import * as qs from 'querystring';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { withKB } from '../../components/KBContext/KBContext';
import util from '../../services/util';
import api from '../../services/api';
import ResourceSelectComponent from '../../components/ResourceSelectComponent/ResourceSelectComponent';

/**
 * Freeform query builder where users can add key-value pairs or nested groups
 * of key-value pairs.
 */
class QueryBuilderViewBase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      params: {},
      tempNested: { query: false },
      tempNames: { query: '' },
      tempValues: { query: '' },
      specOpen: false,
      specBlurbOpen: false,
      endpoint: 'Ontology',
    };

    this.bundle = this.bundle.bind(this);
    this.toggleNested = this.toggleNested.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleNested = this.handleNested.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  /**
   * Bundles query params into a string.
   */
  bundle() {
    const { params, endpoint } = this.state;
    params['@class'] = endpoint;
    const props = Object.keys(params).map(p => ({ name: p }));
    const payload = util.parsePayload(params, props, [], true);
    return qs.stringify(payload);
  }

  /**
   * Toggles staged param type between key-value pair and nested property key.
   * @param {string} key - nested param key.
   */
  toggleNested(key) {
    const { tempNested } = this.state;
    tempNested[key] = !tempNested[key];
    this.setState({ tempNested });
  }

  /**
   * Handles change of a state property.
   * @param {Event} event - User input event.
   */
  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  /**
   * Toggles kb spec iframe dialog.
   */
  handleToggle() {
    const { specOpen } = this.state;
    this.setState({ specOpen: !specOpen });
  }

  /**
   * Handles change of a nested state property.
   * @param {string} type - state key.
   */
  handleNested(type) {
    return (event) => {
      const { [type]: temp } = this.state;
      const { name, value } = event.target;
      temp[name] = value;
      this.setState({ [type]: temp });
    };
  }

  /**
   * Adds temp param to the query.
   * @param {string} k - Nested property key.
   */
  handleAdd(k) {
    const {
      tempNested,
      tempNames,
      tempValues,
      params,
    } = this.state;
    if (
      !tempNames[k]
      || (!tempNested[k] && !tempValues[k])
      || tempNames[k].includes(' ')
    ) {
      return;
    }
    const keys = k.split('.').slice(1);
    keys.push(tempNames[k]);
    const recursiveUpdate = (obj, rKeys, i) => {
      const rObj = obj;
      if (i === rKeys.length - 1) {
        rObj[rKeys[i]] = tempNested[k] ? {} : tempValues[k];
      } else {
        rObj[rKeys[i]] = recursiveUpdate(obj[rKeys[i]], rKeys, i + 1);
      }
      return rObj;
    };
    recursiveUpdate(params, keys, 0);

    tempNames[`${k}.${tempNames[k]}`] = '';
    tempValues[`${k}.${tempNames[k]}`] = '';
    tempNested[`${k}.${tempNames[k]}`] = false;
    tempNames[k] = '';
    tempValues[k] = '';
    tempNested[k] = false;

    this.setState({
      params,
      tempNames,
      tempValues,
      tempNested,
    });
  }

  /**
   * Deletes a parameter from the staged query.
   * @param {string} k - Nested property key.
   */
  handleDelete(k) {
    const {
      params,
      tempNames,
      tempValues,
      tempNested,
    } = this.state;
    const keys = k.split('.').slice(1);
    const recursiveUpdate = (obj, rKeys, i) => {
      const rObj = obj;
      if (i === rKeys.length - 1) {
        delete rObj[rKeys[i]];
      } else {
        rObj[rKeys[i]] = recursiveUpdate(obj[rKeys[i]], rKeys, i + 1);
      }
      return rObj;
    };
    delete tempNames[k];
    delete tempValues[k];
    delete tempNested[k];
    recursiveUpdate(params, keys, 0);
    this.setState({
      params,
      tempNames,
      tempValues,
      tempNested,
    });
  }

  /**
   * Bundles query and navigates to query results page.
   */
  handleSubmit() {
    const { history } = this.props;
    history.push({
      pathname: '/data/table',
      search: this.bundle(),
    });
  }

  render() {
    const { schema } = this.props;
    const {
      params,
      tempNested,
      tempNames,
      tempValues,
      specOpen,
      specBlurbOpen,
      endpoint,
    } = this.state;

    const input = nested => (
      <div className="qbv-input">
        <div className="input-checkbox">
          <input
            type="checkbox"
            onChange={() => this.toggleNested(nested.join('.'))}
            checked={tempNested[nested.join('.')]}
          />
        </div>
        <div className={`input-key ${tempNested[nested.join('.')] && 'input-key-nested'}`}>
          <input
            value={tempNames[nested.join('.')]}
            name={nested.join('.')}
            onChange={this.handleNested('tempNames')}
            onKeyUp={event => event.keyCode === 13
              ? this.handleAdd(nested.join('.'))
              : null}
          />
        </div>
        {!tempNested[nested.join('.')]
          && (
            <div className="input-value">
              <input
                onChange={this.handleNested('tempValues')}
                value={tempValues[nested.join('.')]}
                name={nested.join('.')}
                onKeyUp={event => event.keyCode === 13
                  ? this.handleAdd(nested.join('.'))
                  : null}
              />
            </div>
          )}
        <AddIcon
          className="formatted-close-btn"
          onClick={() => this.handleAdd(nested.join('.'))}
        />
      </div>
    );

    const jsonFormat = (k, value, nested) => {
      const newNested = [...nested, k];
      if (typeof value === 'object') {
        return (
          <React.Fragment key={k}>
            <div className="qbv-json-wrapper">
              <span className="qbv-json-key">{k}</span><span>:&nbsp;</span><span>{'{'}</span>
            </div>
            <div className="qbv-nest">
              {Object.keys(value).map(nestedK => jsonFormat(nestedK, value[nestedK], newNested))}
            </div>
            {input(newNested)}
            <div className="qbv-json-wrapper">
              <span className="qbv-json-close-brace">{'}'}{k !== 'query' && ','}</span>
            </div>
          </React.Fragment>
        );
      }
      return (
        <div key={k} className="qbv-json-wrapper">
          <span>
            <span className="qbv-json-key">
              {k}
            </span>
            :&nbsp;
            <span className="qbv-json-value">&quot;{value}&quot;</span>
            ,
          </span>
          <CloseIcon
            className="formatted-close-btn"
            onClick={() => this.handleDelete(newNested.join('.'))}
          />
        </div>
      );
    };

    const iFrame = <iframe title="api spec" src={`${api.API_BASE_URL}/spec/#/`} />;
    return (
      <div className="qbv">
        <Dialog
          open={specOpen}
          maxWidth="lg"
          fullWidth
          classes={{ paper: 'qbv-swagger-iframe' }}
          onClose={this.handleToggle}
        >
          <div>
            <div style={{ display: 'flex', flexDirection: 'row', padding: '1rem' }}>
              <Typography variant="h5">Help</Typography>
              {specBlurbOpen
                ? <ExpandLessIcon onClick={() => this.setState({ specBlurbOpen: false })} />
                : <ExpandMoreIcon onClick={() => this.setState({ specBlurbOpen: true })} />}
            </div>
            <Collapse in={specBlurbOpen}>
              <div style={{ padding: '1rem' }}>
                Type key value pairs in the inputs to build your query. Use the
                switch to add nested groups of parameters.
                <br />
                <br />
                Here is the GraphKB specification for the api version in use.
              </div>
            </Collapse>
          </div>
          {iFrame}
        </Dialog>
        <Paper className="qbv-header" elevation={4}>
          <Button variant="outlined" onClick={this.handleToggle}>Help</Button>
          <Typography variant="h5">Query Builder</Typography>
        </Paper>
        <Paper className="qbv-body qbv-column-flex">
          <ResourceSelectComponent
            label="Endpoint"
            name="endpoint"
            resources={Object.values(schema.schema)
              .filter(item => item.expose.GET && item.routeName)}
            value={endpoint}
            onChange={this.handleChange}
          >
            {item => <MenuItem key={item.name} value={item.name}>{item.routeName}</MenuItem>}
          </ResourceSelectComponent>
          <div className="qbv-json">
            {jsonFormat('query', params, [])}
          </div>
        </Paper>
        <Button
          id="qbv-submit"
          onClick={this.handleSubmit}
          variant="contained"
          color="primary"
        >
          Submit
        </Button>
      </div>
    );
  }
}

/**
 * @namespace
 * @property {Object} history - Application history state object.
 * @property {Object} schema - Knowledgebase schema object.
 */
QueryBuilderViewBase.propTypes = {
  history: PropTypes.object.isRequired,
  schema: PropTypes.object.isRequired,
};

const QueryBuilderView = withKB(QueryBuilderViewBase);

/**
 * Export consumer component and regular component for testing.
 */
export {
  QueryBuilderView,
  QueryBuilderViewBase,
};
