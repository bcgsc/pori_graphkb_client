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
} from '@material-ui/core';
import kbp from 'knowledgebase-parser';
import * as qs from 'querystring';
import omit from 'lodash.omit';
import SearchIcon from '@material-ui/icons/Search';
import AutoSearchSingle from '../../components/AutoSearchSingle/AutoSearchSingle';
import { withSchema } from '../../components/SchemaContext/SchemaContext';
import util from '../../services/util';

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
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleInvalid = this.handleInvalid.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleVariantParse = this.handleVariantParse.bind(this);
  }

  /**
   * Sets redirect flag to true if there is a valid query (any string).
   */
  handleSubmit() {
    const {
      str,
      disabled,
      tab,
      variant,
      queryable,
    } = this.state;
    const { history, schema } = this.props;
    let search;

    // Matches Knowledgebase api separator characters
    const pattern = new RegExp(/[\s:\\;,./+*=!?[\]()]+/, 'gm');
    if (tab === 'ontology') {
      if (str && !disabled) {
        const trimmed = String(str).trim().toLowerCase();
        const matched = !trimmed.split(pattern).some(chunk => chunk.length < 4);
        search = `?name=${matched ? '~' : ''}${encodeURIComponent(trimmed)}`;
      }
    } else if (tab === 'variant' && str && queryable) {
      ['type', 'reference1', 'reference2'].forEach((k) => { variant[k] = { name: variant[k] }; });
      const payload = util.parsePayload(
        variant,
        schema.getClass('PositionalVariant').properties.filter(p => !p.name.includes('Repr')),
        [],
        true,
      );
      Object.keys(payload).forEach((k) => {
        const trimmed = String(payload[k]).trim().toLowerCase();
        if (!trimmed.split(pattern).some(chunk => chunk.length < 4)) {
          payload[k] = `~${trimmed}`;
        } else {
          payload[k] = trimmed;
        }
      });
      payload['@class'] = 'PositionalVariant';
      search = qs.stringify(payload);
    }
    if (search) {
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
    const { name, value } = e.target;
    if (name && name.includes('.data')) {
      this.setState({ [name.split('.data')[0]]: value && (value.name || value.sourceId) });
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
        const parsed = omit(e.content.parsed, 'variantString');
        if (Object.keys(parsed) !== 0) {
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
    } = this.state;
    const { history } = this.props;

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
