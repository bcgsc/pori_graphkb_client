/**
 * @module /views/QueryView
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './QueryView.css';
import {
  Button,
  IconButton,
  Tab,
  Tabs,
  TextField,
  InputAdornment,
  Typography,
} from '@material-ui/core';
import kbp from '@bcgsc/knowledgebase-parser';
import * as qs from 'querystring';
import SearchIcon from '@material-ui/icons/Search';
import AutoSearchSingle from '../../components/AutoSearchSingle/AutoSearchSingle';
import { withSchema } from '../../components/SchemaContext/SchemaContext';
import util from '../../services/util';

const KB_SEP_CHARS = new RegExp(/[\s:\\;,./+*=!?[\]()]+/, 'gm');

/**
 * View for simple search by name query. Form submissions are passed through the URL to
 * the DataView module to handle the query transaction.
 */
class QueryViewBase extends Component {
  constructor(props) {
    super(props);
    const { state } = props.history.location;
    const initName = state
      && state.mainParams
      && state.mainParams.name
      ? state.mainParams.name
      : '';

    this.state = {
      str: initName,
      disabled: false,
      tab: 'ontology',
      variantError: '',
      variant: {},
      queryable: false,
      relevance: '',
      appliesTo: '',
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleInvalid = this.handleInvalid.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleVariantParse = this.handleVariantParse.bind(this);
    this.submitOntology = this.submitOntology.bind(this);
    this.submitVariant = this.submitVariant.bind(this);
    this.submitStatement = this.submitStatement.bind(this);
  }

  /**
   * Calls submit function for currently active tab.
   */
  handleSubmit() {
    const {
      tab,
    } = this.state;

    if (tab === 'ontology') {
      this.submitOntology();
    } else if (tab === 'variant') {
      this.submitVariant();
    } else if (tab === 'statement') {
      this.submitStatement();
    }
  }

  /**
   * Submits string as ontology "name" property in query.
   */
  submitOntology() {
    const {
      str,
      disabled,
    } = this.state;
    const { history } = this.props;

    // Matches Knowledgebase api separator characters
    if (str && !disabled) {
      const trimmed = String(str).trim().toLowerCase();
      const matched = !trimmed.split(KB_SEP_CHARS).some(chunk => chunk.length < 4);
      const search = `?name=${matched ? '~' : ''}${encodeURIComponent(trimmed)}`;
      history.push({
        pathname: '/data/table',
        search,
      });
    }
  }

  /**
   * Sets the relevance and appliesTo strings to the corresponding link
   * properties' "name" property.
   */
  submitStatement() {
    const {
      relevance,
      appliesTo,
    } = this.state;
    const { history } = this.props;
    if (relevance || appliesTo) {
      let trimmed = [relevance, appliesTo].map(v => String(v).trim().toLowerCase());
      const matched = trimmed.map(t => !t.split(KB_SEP_CHARS).some(chunk => chunk.length < 4));
      trimmed = trimmed.map((t, i) => matched[i] ? `~${t}` : t);
      let search = ['?@class=Statement'];
      if (trimmed[0]) {
        // Cast string to linked property name
        search.push(`relevance[name]=${encodeURIComponent(trimmed[0])}`);
      }
      if (trimmed[1]) {
        // Cast string to linked property name
        search.push(`appliesTo[name]=${encodeURIComponent(trimmed[1])}`);
      }
      search = search.join('&');
      history.push({
        pathname: '/data/table',
        search,
      });
    }
  }

  /**
   * Stringifies all queryable properties of parsed variant.
   */
  submitVariant() {
    const {
      str,
      variant,
      queryable,
    } = this.state;
    const { history, schema } = this.props;
    if (str && queryable) {
      ['type', 'reference1', 'reference2'].forEach((k) => { variant[k] = { name: variant[k] }; });
      const payload = util.parsePayload(
        variant,
        schema.getProperties('PositionalVariant').filter(p => !p.name.includes('Repr')),
        [],
        true,
      );
      Object.keys(payload).forEach((k) => {
        const trimmed = String(payload[k]).trim().toLowerCase();
        if (!trimmed.split(KB_SEP_CHARS).some(chunk => chunk.length < 4)) {
          payload[k] = `~${trimmed}`;
        } else {
          payload[k] = trimmed;
        }
      });
      payload['@class'] = 'PositionalVariant';
      const search = qs.stringify(payload);

      history.push({
        pathname: '/data/table',
        search,
      });
    }
  }

  /**
   * Updates state from user input.
   * @param {Event} e - user input event.
   */
  handleChange(e) {
    const { schema } = this.props;
    const { name, value } = e.target;
    if (name && name.includes('.data') && value) {
      this.setState({ [name.split('.data')[0]]: schema.getPreview(value) });
    } else {
      this.setState({ [name]: value, disabled: false });
    }
  }

  /**
   * Binds autosearch disabled flag to search button.
   */
  handleInvalid() {
    this.setState({ disabled: true });
  }

  /**
   * Updates variant state based on shorthand string.
   */
  handleVariantParse() {
    const { str } = this.state;
    try {
      this.setState({
        variant: kbp.variant.parse(str),
        variantError: '',
      });
    } catch (e) {
      // If anything is parsed, use that..
      const update = { variantError: str ? e.message : '', queryable: false };
      if (e.content && e.content.parsed) {
        const { variantString, ...parsed } = e.content.parsed;
        if (Object.keys(parsed).length !== 0) {
          update.variant = parsed;
          update.queryable = true;
        }
      }
      this.setState(update);
    }
  }

  render() {
    const {
      str,
      tab,
      variantError,
      queryable,
      relevance,
      appliesTo,
    } = this.state;
    const { history, schema } = this.props;

    return (
      <div className="search-wrapper">
        <div className="search-tabs">
          <Tabs
            fullWidth
            value={tab}
            onChange={(_, v) => {
              this.handleChange({ target: { value: v, name: 'tab' } });
              this.handleVariantParse();
            }}
            color="primary"
          >
            <Tab value="ontology" label="Ontologies" />
            <Tab value="variant" label="Variants" />
            <Tab value="statement" label="Statements" />
          </Tabs>
        </div>
        <div className="search-bar">
          <div
            className="main-search"
            onKeyUp={(e) => {
              if (e.keyCode === 13) {
                this.handleSubmit();
              }
            }}
            role="textbox"
            tabIndex={0}
          >
            {tab === 'ontology' && (
              <AutoSearchSingle
                value={str}
                onChange={this.handleChange}
                placeholder="Search by Name"
                limit={30}
                name="str"
                onInvalid={this.handleInvalid}
                onAction={this.handleSubmit}
                endAdornment={(
                  <IconButton id="search-btn" onClick={this.handleSubmit} color="primary">
                    <SearchIcon />
                  </IconButton>
                )}
              />
            )}
            {tab === 'variant' && (
              <div>
                <TextField
                  placeholder="Search by HGVS Shorthand"
                  fullWidth
                  value={str}
                  name="str"
                  onChange={this.handleChange}
                  onKeyUp={this.handleVariantParse}
                  error={!!(variantError && !queryable)}
                  helperText={variantError}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment>
                        <IconButton id="search-btn" onClick={this.handleSubmit} color="primary">
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
            )}
            {tab === 'statement' && (
              <div style={{ display: 'flex' }}>
                <AutoSearchSingle
                  placeholder="Relevance"
                  fullWidth
                  value={relevance}
                  name="relevance"
                  endpoint={schema.getRoute('Vocabulary').slice(1)}
                  onChange={this.handleChange}
                  className="query-statement-textfield"
                  endAdornment={null}
                />
                <Typography color="textSecondary" className="query-statements-to">to</Typography>
                <AutoSearchSingle
                  placeholder="Applies To"
                  fullWidth
                  value={appliesTo}
                  name="appliesTo"
                  endpoint={schema.getRoute('Ontology').slice(1)}
                  onChange={this.handleChange}
                  className="query-statement-textfield"
                  endAdornment={(
                    <InputAdornment>
                      <IconButton id="search-btn" onClick={this.handleSubmit} color="primary">
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>)}
                />
              </div>
            )}
          </div>
        </div>
        <Button
          variant="outlined"
          color="secondary"
          className="advanced-button"
          onClick={() => history.push({ state: this.state, pathname: '/query/advanced' })}
        >
          Advanced Search
        </Button>
      </div>
    );
  }
}
/**
 * @namespace
 * @property {Object} history - Application routing history object.
 * @property {Object} schema - Knowledgebase schema object.
 */
QueryViewBase.propTypes = {
  history: PropTypes.object.isRequired,
  schema: PropTypes.object.isRequired,
};

const QueryView = withSchema(QueryViewBase);

export {
  QueryView,
  QueryViewBase,
};
