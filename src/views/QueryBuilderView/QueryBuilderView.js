/**
 * @module /views/QueryBuilderView
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Dialog,
  Paper,
  Typography,
  Collapse,
  MenuItem,
  Tooltip,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import HelpIcon from '@material-ui/icons/Help';
import * as qs from 'querystring';
import { Link } from 'react-router-dom';
import { boundMethod } from 'autobind-decorator';

import './QueryBuilderView.scss';
import { KBContext } from '../../components/KBContext';
import { CodeInput } from './components';
import ResourceSelectComponent from '../../components/ResourceSelectComponent';
import api from '../../services/api';
import auth from '../../services/auth';

const COMMENT_REGEX = /\/\/.*(?!\\n)/g;

const EXAMPLE_PAYLOAD = `// See help for more info about constructing payloads
// Example Query: "Find statements that are implied by variants on the gene KRAS"
{
    "compoundSyntax": true,
    "where": [
        {
            "attr": "outE(impliedby).vertex.reference1.name",
            "value": "KRAS"
        }
    ]
}`;


const parseJSON = (string) => {
  const text = string.replace(COMMENT_REGEX, '');
  return JSON.parse(text);
};

/**
 * Freeform query builder where users can add key-value pairs or nested groups
 * of key-value pairs.
 *
 * @property {Object} props.history - Application history state object.
 */
class QueryBuilderView extends Component {
  static contextType = KBContext;

  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      specOpen: false,
      specBlurbOpen: false,
      endpoint: 'Statement',
      text: EXAMPLE_PAYLOAD,
      error: '',
      params: parseJSON(EXAMPLE_PAYLOAD),
    };
  }

  /**
   * Bundles query params into a string.
   */
  @boundMethod
  bundle() {
    const { params, endpoint } = this.state;
    const cls = params['@class'] || endpoint;
    delete params['@class'];
    const payload = {
      complex: encodeURIComponent(btoa(JSON.stringify(params))),
      '@class': cls,
    };
    return qs.stringify(payload);
  }

  /**
   * Handles change of a state property.
   * @param {Event} event - User input event.
   */
  @boundMethod
  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  /**
   * Toggles kb spec iframe dialog.
   */
  @boundMethod
  handleToggle() {
    const { specOpen } = this.state;
    this.setState({ specOpen: !specOpen });
  }

  /**
   * Bundles query and navigates to query results page.
   */
  @boundMethod
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
  @boundMethod
  handleText(event) {
    const { value } = event.target;
    try {
      const params = parseJSON(value);
      this.setState({ params, error: '' });
    } catch (error) {
      this.setState({ error: error.toString() });
    } finally {
      this.setState({ text: value });
    }
  }

  render() {
    const { schema } = this.context;
    const {
      specOpen,
      specBlurbOpen,
      endpoint,
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
                Build your query string as a JSON object. All queries sent
                using this form will be complex POST queries.
                <br />
                <br />
                Here is the GraphKB specification for the api version in use.
                Follow complex POST syntax.
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
              resources={schema.getQueryable(auth.isAdmin())}
              value={endpoint}
              onChange={this.handleChange}
            >
              {item => <MenuItem key={item.name} value={item.name}>{item.name}</MenuItem>}
            </ResourceSelectComponent>
          </div>
          <div className="qbv-json">
            <CodeInput
              placeholder="Query Payload"
              value={text}
              onChange={this.handleText}
              tabIndex={0}
              rules={[
                { regex: /"[\w\t\-~!@#$`'%^&*()+=|\\{}[\];"<>,. ]+"(?![ \t]*:)/g, color: 'orange', className: '' },
                { regex: /[^"\w*]([0-9]+|true|false)(?!\w*")/g, color: 'blue', className: '' },
                { regex: /"\w+"[ \t]*:/g, color: 'purple', className: '' },
                { regex: COMMENT_REGEX, color: 'green', className: '' },
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


export default QueryBuilderView;
