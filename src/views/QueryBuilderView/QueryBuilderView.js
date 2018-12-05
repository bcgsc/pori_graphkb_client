/**
 * @module /views/QueryBuilderView
 */
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
  Tooltip,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import HelpIcon from '@material-ui/icons/Help';
import * as qs from 'querystring';
import { Link } from 'react-router-dom';
import { withKB } from '../../components/KBContext/KBContext';
import util from '../../services/util';
import api from '../../services/api';
import ResourceSelectComponent from '../../components/ResourceSelectComponent/ResourceSelectComponent';
import CodeInput from '../../components/CodeInput/CodeInput';

const COMMENT_REGEX = /\/\/.*(?!\\n)/g;

const EXAMPLE_PAYLOAD = `// See help for more info about constructing payloads
{
    "where": [
        {
            "attr": {
                "type": "EDGE",
                "edges": ["Implies"],
                "direction": "in",
                "child": {
                    "attr": "vertex",
                    "type": "LINK",
                    "child": {
                        "attr": "reference1",
                        "type": "LINK",
                        "child": "name"
                    }
                }
            },
            "value": "KRAS"
        }
    ]
}
// "Find all statements which are implied by a variant on the gene KRAS"`;


const parseJSON = (string) => {
  const text = string.replace(COMMENT_REGEX, '');
  return JSON.parse(text);
};

/**
 * Freeform query builder where users can add key-value pairs or nested groups
 * of key-value pairs.
 */
class QueryBuilderViewBase extends Component {
  constructor(props) {
    super(props);
    this.state = {
      specOpen: false,
      specBlurbOpen: false,
      isComplex: true,
      endpoint: 'Statement',
      text: EXAMPLE_PAYLOAD,
      error: '',
      params: parseJSON(EXAMPLE_PAYLOAD),
    };

    this.bundle = this.bundle.bind(this);
    this.handleChange = this.handleChange.bind(this);
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
   * Bundles query and navigates to query results page.
   */
  handleSubmit() {
    const { history } = this.props;
    const { error } = this.state;
    if (!error) {
      history.push({
        pathname: '/data/table',
        search: this.bundle(),
      });
    }
  }


  /**
   * Parses user input as JSON and sets error if malformed. Otherwise, update
   * params object.
   * @param {Event} event - User input event
   */
  handleText(event) {
    try {
      const params = parseJSON(event.target.value);
      this.setState({ params, error: '' });
    } catch (error) {
      this.setState({ error: error.toString() });
    } finally {
      this.setState({ text: event.target.value });
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
          <Tooltip title="Query building help">
            <HelpIcon onClick={this.handleToggle} color="primary" />
          </Tooltip>
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
            <CodeInput
              placeholder="Query Payload"
              value={text}
              onChange={this.handleText}
              tabIndex={0}
              rules={[
                { regex: COMMENT_REGEX, color: 'green', className: '' },
                { regex: /"\w+"\s*:/g, color: 'purple', className: '' },
                { regex: /"\w+"(?!\s*:)/g, color: 'orange', className: '' },
                { regex: /[^"\w*]([0-9]+)(?!\w*")/g, color: 'blue', className: '' },
              ]}
            />
            {error && text && (
              <Typography variant="caption" color="error">
                {error}
              </Typography>
            )}
          </div>
        </Paper>
        <Paper className="qbv-action-btns">
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
