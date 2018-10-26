import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './QueryBuilderView.css';
/* eslint-disable */
import {
  Button,
  Input,
  IconButton,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  Paper,
  Typography,
  Switch,
} from '@material-ui/core';
import * as qs from 'querystring';
import AddIcon from '@material-ui/icons/Add';
import AssignmentIcon from '@material-ui/icons/Assignment';
import { withSchema } from '../../components/SchemaContext/SchemaContext';
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
    };

    this.bundle = this.bundle.bind(this);
    this.toggleNested = this.toggleNested.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleNested = this.handleNested.bind(this);
    this.handleSpecToggle = this.handleSpecToggle.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  bundle() {
    const { params } = this.state;
    const props = Object.keys(params).map(p => ({ name: p }));
    const payload = util.parsePayload(params, props);
    console.log(payload);
    return qs.stringify(payload);
  }

  toggleNested(key) {
    const { tempNested } = this.state;
    tempNested[key] = !tempNested[key];
    this.setState({ tempNested });
  }

  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleSpecToggle() {
    const { specOpen } = this.state;
    this.setState({ specOpen: !specOpen })
  }

  handleNested(type) {
    return (e) => {
      const { [type]: temp } = this.state;
      const { name, value } = e.target;
      temp[name] = value;
      this.setState({ [type]: temp });
    }
  }

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
    const recursiveUpdate = (obj, keys, i) => {
      if (i === keys.length - 1) {
        obj[keys[i]] = tempNested[k] ? {} : tempValues[k];
      } else {
        obj[keys[i]] = recursiveUpdate(obj[keys[i]], keys, i + 1);
      }
      return obj;
    }
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

  handleDelete(k) {
    const {
      params,
      tempNames,
      tempValues,
      tempNested,
    } = this.state;
    const keys = k.split('.').slice(1);
    const recursiveUpdate = (obj, keys, i) => {
      if (i === keys.length - 1) {
        delete obj[keys[i]];
      } else {
        obj[keys[i]] = recursiveUpdate(obj[keys[i]], keys, i + 1);
      }
      return obj;
    }
    delete tempNames[k];
    delete tempValues[k];
    delete tempNested[k];
    recursiveUpdate(params, keys, 0)
    this.setState({
      params,
      tempNames,
      tempValues,
      tempNested,
    });
  }

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
    } = this.state;

    const input = (nested) => (
      <div className="qbv-input">
        <Switch onClick={() => this.toggleNested(nested.join('.'))} />
        <input
          placeholder="Key"
          value={tempNames[nested.join('.')]}
          name={nested.join('.')}
          onChange={this.handleNested('tempNames')}
        />
        {!tempNested[nested.join('.')]
          && (
            <input
              placeholder="Value"
              onChange={this.handleNested('tempValues')}
              value={tempValues[nested.join('.')]}
              name={nested.join('.')}
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
      } else {
        return (
          <ListItem key={k}>
            <ListItemText primary={value} secondary={k} />
            <ListItemSecondaryAction>
              <Button onClick={() => this.handleDelete(newNested.join('.'))}>delete</Button>
            </ListItemSecondaryAction>
          </ListItem>
        )
      }
    }

    const jsonFormat = (k, value, nested) => {
      const newNested = [...nested, k];
      if (typeof value === 'object') {
        return (
          <React.Fragment key={k}>
            <span className="qbv-json-key">{k}</span><span>:&nbsp;</span><span >{'{'}</span>
            <div className="qbv-nest">
              {Object.keys(value).map(nestedK => jsonFormat(nestedK, value[nestedK], newNested))}
            </div>
            <span className="qbv-json-close-brace">{'}'}</span>
          </React.Fragment>
        );
      } else {
        return (
          <div key={k}>
            <span className="qbv-json-key">{k}</span>:&nbsp;<span className="qbv-json-value">"{value}"</span>,
          </div>
        )
      }
    }

    const iFrame = <iframe src={`${api.API_BASE_URL}/spec/#/`} />;
    return (
      <div className="qbv">
        <Dialog
          open={specOpen}
          maxWidth="lg"
          fullWidth
          classes={{ paper: 'qbv-swagger-iframe' }}
          onClose={this.handleSpecToggle}
        >
          {iFrame}
        </Dialog>
        <Paper className="qbv-header" elevation={4}>
          <Button variant="outlined" onClick={this.handleSpecToggle}>Help</Button>
          <Typography variant="h5">Query Builder</Typography>
        </Paper>
        <Paper className="qbv-body">
          <List className="qbv-tree">
            {format('query', params, [])}
          </List>
          <div className="qbv-json">
            {jsonFormat('query', params, [])}
          </div>
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

const QueryBuilderView = withSchema(QueryBuilderViewBase);

/**
 * Export consumer component and regular component for testing.
 */
export {
  QueryBuilderView,
  QueryBuilderViewBase,
};
