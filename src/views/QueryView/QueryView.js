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
import SearchIcon from '@material-ui/icons/Search';
import AutoSearchComponent from '../../components/AutoSearchComponent/AutoSearchComponent';

/**
 * View for simple search by name query. Form submissions are passed through the URL to
 * the DataView module to handle the query transaction.
 */
class QueryView extends Component {
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
      variantError,
    } = this.state;
    const { history } = this.props;
    if (tab === 'ontology') {
      if (str && !disabled) {
        history.push({
          pathname: '/data/table',
          search: `?name=~${str.trim()}`,
        });
      }
    } else if (tab === 'variant' && str && !variantError) {
      let search = '?@class=PositionalVariant';
      Object.keys(variant).forEach((key) => {
        if (key !== 'prefix' && key !== 'multiFeature') {
          if (key === 'reference1' || key === 'reference2' || key === 'type') {
            search += `&${key}[name]=${variant[key]}`;
          } else if (typeof variant[key] === 'object') {
            Object.keys(variant[key]).forEach((nestedKey) => {
              search += `&${key}[${nestedKey}]=${variant[key][nestedKey]}`;
            });
          } else {
            search += `&${key}=${variant[key]}`;
          }
        }
      });
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
    this.setState({ [e.target.name]: e.target.value, disabled: false });
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
      const update = { variantError: str ? e.message : '' };
      if (e.content && e.content.parsed) {
        update.variant = e.content.parsed;
      }
      this.setState(update);
    }
  }

  render() {
    const {
      str,
      tab,
      variantError,
    } = this.state;
    const { history } = this.props;

    return (
      <div className="search-wrapper">
        <div className="search-tabs">
          <Tabs
            fullWidth
            value={tab}
            onChange={(_, v) => this.handleChange({ target: { value: v, name: 'tab' } })}
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
              <AutoSearchComponent
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
              <div style={{ height: 64 }}>
                <TextField
                  placeholder="Search by HGVS Shorthand"
                  fullWidth
                  value={str}
                  name="str"
                  onChange={this.handleChange}
                  onKeyUp={this.handleVariantParse}
                  error={!!variantError}
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
QueryView.propTypes = {
  history: PropTypes.object.isRequired,
};

export default QueryView;
