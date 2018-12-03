/**
 * @module /views/QueryBuilderView
 */
/* eslint-disable no-unused-vars */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './QueryBuilderView.css';
import {
  Button,
  Dialog,
  Paper,
  Typography,
  FormControlLabel,
  Collapse,
  MenuItem,
  Checkbox,
} from '@material-ui/core';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import * as qs from 'querystring';
import { Link } from 'react-router-dom';
import { withKB } from '../../components/KBContext/KBContext';
import util from '../../services/util';
import api from '../../services/api';
import ResourceSelectComponent from '../../components/ResourceSelectComponent/ResourceSelectComponent';

const COMMENT_REGEX = /\/\/.*(?!\\n)/g;

const EXAMPLE_PAYLOAD = `// See help for more info about constructing payloads
// This query yields -> GET [/endpoint]s WHERE example = "json payload"
{
    "example": "json payload"
}`;

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
      isComplex: false,
      endpoint: 'Ontology',
      text: EXAMPLE_PAYLOAD,
      error: '',
    };

    this.bundle = this.bundle.bind(this);
    this.toggleNested = this.toggleNested.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleNested = this.handleNested.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleText = this.handleText.bind(this);
  }

  /**
   * Bundles query params into a string.
   */
  bundle() {
    const { params, endpoint, isComplex } = this.state;
    params['@class'] = endpoint;
    if (isComplex) {
      params.c = true;
    }
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
   * @param {Event} e - User input event.
   */
  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value });
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
    return (e) => {
      const { [type]: temp } = this.state;
      const { name, value } = e.target;
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

  handleText(e) {
    try {
      const text = e.target.value.replace(COMMENT_REGEX, '');
      const json = JSON.parse(text);
      this.setState({ params: json, error: '' });
    } catch (error) {
      this.setState({ error: error.toString() });
    } finally {
      this.setState({ text: e.target.value });
    }
  }

  render() {
    const { schema } = this.props;
    const {
      specOpen,
      specBlurbOpen,
      endpoint,
      isComplex,
      text,
      error,
    } = this.state;

    let comments = text.replace(/.(?!\\n)/g, ' ');

    let match = COMMENT_REGEX.exec(text);
    while (match) {
      comments = `${comments.slice(0, match.index)}${match[0]}${comments.slice(match.index + match[0].length)}`;
      match = COMMENT_REGEX.exec(text);
    }

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
            <div className="qbv-help-blurb">
              <Typography variant="h5">Help</Typography>
              {specBlurbOpen
                ? <ExpandLessIcon onClick={() => this.setState({ specBlurbOpen: false })} />
                : <ExpandMoreIcon onClick={() => this.setState({ specBlurbOpen: true })} />}
            </div>
            <Collapse in={specBlurbOpen}>
              <div style={{ padding: '1rem' }}>
                Build your query string as a JSON object. Use the select to
                specify your route and whether or not the query is complex.
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
          <div className="qbv-endpoint">
            <ResourceSelectComponent
              label="Endpoint"
              name="endpoint"
              resources={Object.values(schema.schema)
                .filter(item => item.expose.GET && item.routeName)}
              value={endpoint}
              onChange={this.handleChange}
            >
              {item => <MenuItem key={item.name} value={item.name}>{item.routeName + (isComplex ? '/search' : '')}</MenuItem>}
            </ResourceSelectComponent>
            <FormControlLabel
              className="qbv-complex-checkbox"
              control={(
                <Checkbox
                  checked={isComplex}
                  name="isComplex"
                  onChange={() => this.handleChange({ target: { name: 'isComplex', value: !isComplex } })}
                />
              )}
              label="Complex"
            />
          </div>
          <div className="qbv-json">
            <textarea
              value={comments}
              className="comment-textarea"
              readOnly
            />
            <textarea
              className="field-textarea"
              placeholder="Query Payload"
              value={text}
              onChange={this.handleText}
              style={{ zIndex: 4 }}
              tabIndex={0}
            />
            {error && text && (
              <Typography variant="caption" color="error">
                {error}
              </Typography>
            )}
          </div>
        </Paper>
        <div className="qbv-action-btns">
          <Link to="/query/advanced">
            <Button variant="contained">Back</Button>
          </Link>

          <Button
            id="qbv-submit"
            onClick={this.handleSubmit}
            variant="contained"
            color="primary"
          >
            Submit
          </Button>
        </div>
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
