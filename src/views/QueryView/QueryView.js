/**
 * @module /views/QueryView
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './QueryView.css';
import {
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Checkbox,
  FormControlLabel,
} from '@material-ui/core';
import kbp from '@bcgsc/knowledgebase-parser';
import * as qs from 'querystring';
import SearchIcon from '@material-ui/icons/Search';
import AutoSearchSingle from '../../components/AutoSearchSingle';
import { withKB } from '../../components/KBContext';
import util from '../../services/util';

const KB_SEP_CHARS = new RegExp(/[\s:\\;,./+*=!?[\]()]+/, 'gm');

const ENTER_KEYCODE = 13;

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
      hgvs: false,
      variantError: '',
      variant: {},
      queryable: false,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleInvalid = this.handleInvalid.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleVariantParse = this.handleVariantParse.bind(this);
    this.submitVariant = this.submitVariant.bind(this);
    this.submitStatementOrOntology = this.submitStatementOrOntology.bind(this);
  }

  /**
   * Calls submit function for currently active tab.
   */
  handleSubmit() {
    const {
      hgvs,
    } = this.state;

    if (hgvs) {
      this.submitVariant();
    } else {
      this.submitStatementOrOntology();
    }
  }

  submitStatementOrOntology() {
    const {
      str,
      disabled,
    } = this.state;
    const { history } = this.props;
    if (str && !disabled) {
      const trimmed = String(str).trim().toLowerCase();
      history.push({
        pathname: '/data/table',
        search: qs.stringify({ keyword: trimmed }),
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
   * @param {Event} event - user input event.
   */
  handleChange(event) {
    const { schema } = this.props;
    const { name, value } = event.target;
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
    } catch (error) {
      // If anything is parsed, use that..
      const update = { variantError: str ? error.message : '', queryable: false };
      if (error.content && error.content.parsed) {
        const { variantString, ...parsed } = error.content.parsed;
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
      hgvs,
      variantError,
      queryable,
    } = this.state;
    const { history } = this.props;

    return (
      <div className="search-wrapper">
        <div className="search-bar">
          <div
            className="main-search"
            onKeyUp={event => event.keyCode === ENTER_KEYCODE && this.handleSubmit()}
            role="textbox"
            tabIndex={0}
          >
            {!hgvs && (
              <AutoSearchSingle
                value={str}
                onChange={this.handleChange}
                placeholder="Search by Keyword"
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
            {hgvs && (
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
            <FormControlLabel
              control={<Checkbox />}
              label="HGVS Shorthand"
              checked={hgvs}
              onChange={() => this.handleChange({ target: { value: !hgvs, name: 'hgvs' } })}
              color="primary"
            />
          </div>
        </div>
        <Button
          variant="outlined"
          color="secondary"
          className="advanced-button"
          onClick={() => history.push({ pathname: '/query/advanced' })}
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

const QueryView = withKB(QueryViewBase);

export {
  QueryView,
  QueryViewBase,
};
