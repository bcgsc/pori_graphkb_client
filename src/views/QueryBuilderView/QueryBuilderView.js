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
} from '@material-ui/core';
import * as qs from 'querystring';
import AddIcon from '@material-ui/icons/Add';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { withKB } from '../../components/KBContext/KBContext';
import util from '../../services/util';
import api from '../../services/api';

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
    const { params } = this.state;
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

  render() {
    const {
      params,
      tempNested,
      tempNames,
      tempValues,
      specOpen,
      specBlurbOpen,
    } = this.state;

    const input = nested => (
      <div className="qbv-input">
        <Switch
          onClick={() => this.toggleNested(nested.join('.'))}
          checked={tempNested[nested.join('.')]}
        />
        <input
          placeholder="Key"
          value={tempNames[nested.join('.')]}
          name={nested.join('.')}
          onChange={this.handleNested('tempNames')}
          onKeyUp={e => e.keyCode === 13 ? this.handleAdd(nested.join('.')) : null}
        />
        {!tempNested[nested.join('.')]
          && (
            <input
              placeholder="Value"
              onChange={this.handleNested('tempValues')}
              value={tempValues[nested.join('.')]}
              name={nested.join('.')}
              onKeyUp={e => e.keyCode === 13 ? this.handleAdd(nested.join('.')) : null}
            />
          )}
        <IconButton onClick={() => this.handleAdd(nested.join('.'))}>
          <AddIcon />
        </IconButton>
      </div>
    );

    const format = (k, value, nested) => {
      const newNested = [...nested, k];
      if (typeof value === 'object') {
        return (
          <React.Fragment key={k}>
            <ListItem>
              <ListItemText primary={k} />
              {k !== 'query' && (
                <ListItemSecondaryAction>
                  <Button onClick={() => this.handleDelete(newNested.join('.'))}>
                    delete
                  </Button>
                </ListItemSecondaryAction>
              )}
            </ListItem>
            <List
              className="qbv-nest"
              dense
              disablePadding
            >
              {Object.keys(value).map(nestedK => format(nestedK, value[nestedK], newNested))}
              {input(newNested)}
            </List>
          </React.Fragment>
        );
      }
      return (
        <ListItem key={k}>
          <ListItemText primary={value} secondary={k} />
          <ListItemSecondaryAction>
            <Button onClick={() => this.handleDelete(newNested.join('.'))}>delete</Button>
          </ListItemSecondaryAction>
        </ListItem>
      );
    };

    const jsonFormat = (k, value, nested) => {
      const newNested = [...nested, k];
      if (typeof value === 'object') {
        return (
          <React.Fragment key={k}>
            <span className="qbv-json-key">{k}</span><span>:&nbsp;</span><span>{'{'}</span>
            <div className="qbv-nest">
              {Object.keys(value).map(nestedK => jsonFormat(nestedK, value[nestedK], newNested))}
            </div>
            <span className="qbv-json-close-brace">{'}'}{k !== 'query' && ','}</span>
          </React.Fragment>
        );
      }
      return (
        <div key={k}>
          <span className="qbv-json-key">
            {k}
          </span>
          :&nbsp;
          <span className="qbv-json-value">&quot;{value}&quot;</span>
          ,
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
        <Paper className="qbv-body">
          <div className="qbv-json">
            {jsonFormat('query', params, [])}
          </div>
        </Paper>
        <Paper className="qbv-body">
          <List className="qbv-tree">
            {format('query', params, [])}
          </List>
          <Button
            id="qbv-submit"
            onClick={this.handleSubmit}
            variant="contained"
            color="primary"
          >
            Submit
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
/* eslint-disable */
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
