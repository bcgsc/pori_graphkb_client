/**
 * @module /views/QueryView
 */
import './index.scss';

import kbp from '@bcgsc/knowledgebase-parser';
import {
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import { boundMethod } from 'autobind-decorator';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import api from '@/services/api';
import schema from '@/services/schema';

const ENTER_KEYCODE = 13;
const MIN_WORD_LENGTH = 3;


/**
 * View for simple search by name query. Form submissions are passed through the URL to
 * the DataView module to handle the query transaction.
 *
 * @property {Object} props.history - Application routing history object.
 */
class QueryView extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      hgvs: false,
      variantError: '',
      keyWordError: '',
      variant: {},
    };
  }

  @boundMethod
  searchKeyword() {
    const {
      value,
    } = this.state;
    const { history } = this.props;

    if (value) {
      const trimmed = String(value)
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length >= MIN_WORD_LENGTH);

      if (!trimmed.length) {
        this.setState({ keyWordError: `Must have 1 or more terms of at least ${MIN_WORD_LENGTH} characters` });
      } else {
        const payload = {
          queryType: 'keyword',
          target: 'Statement',
          keyword: trimmed.join(' '),
        };

        const searchChipProps = {
          searchType: 'Quick',
          // keyword: trimmed.join(' '),
        };

        const search = api.encodeQueryComplexToSearch(payload, 'Statement', searchChipProps);
        console.log('TCL: QueryView -> searchKeyword -> search', search);
        history.push({
          pathname: '/data/table',
          search,
        });
      }
    }
  }

  /**
   * Stringifies all queryable properties of parsed variant.
   */
  @boundMethod
  searchByHGVS() {
    const {
      variant,
    } = this.state;
    const { history } = this.props;

    if (variant) {
      const search = api.encodeQueryComplexToSearch({
        target: 'Statement',
        filters: {
          conditions: api.buildSearchFromParseVariant(schema, variant),
          operator: 'CONTAINSANY',
        },
      }, 'Statement');

      history.push({
        pathname: '/data/table',
        search,
      });
    }
  }

  /**
   * Calls submit function for currently active tab.
   */
  @boundMethod
  handleSubmit() {
    const {
      hgvs, variant, value,
    } = this.state;

    if (value) {
      if (hgvs) {
        if (variant || !value) {
          this.searchByHGVS();
        }
      } else {
        this.searchKeyword();
      }
    }
  }

  /**
   * Updates state from user input.
   * @param {Event} event - user input event.
   */
  @boundMethod
  handleChange(event, hgvsChecked = false) {
    const { hgvs } = this.state;
    const { target: { value } } = event;
    let hgvsFlag = hgvsChecked
      ? !hgvs
      : hgvs;

    if (value) {
      // try to parse the variant notation
      try {
        const parsed = kbp.variant.parse(value);
        this.setState({ variant: parsed, variantError: '', keyWordError: '' });

        if (!hgvsChecked) {
          this.setState({ hgvs: true });
          hgvsFlag = true;
        }
      } catch (err) {
        // if it was partially parsed use that result
        if (hgvsFlag) {
          if (err.content && err.content.parsed) {
            const { content: { parsed: { variantString, ...parsed } } } = err;
            this.setState({ variant: parsed, variantError: `${err || err.message}`, keyWordError: '' });
          } else {
            this.setState({ variant: null, variantError: `${err || err.message}`, keyWordError: '' });
          }
        }
      }
    }
    if (!hgvsFlag) {
      // check that the words are sufficient length
      const trimmed = String(value)
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length >= MIN_WORD_LENGTH);

      if (!trimmed.length) {
        this.setState({
          keyWordError: `Must have 1 or more terms of at least ${MIN_WORD_LENGTH} characters`,
          variantError: '',
        });
      } else {
        this.setState({ keyWordError: '', variantError: '' });
      }
    }

    this.setState({ value });
  }

  /**
   * Handles the user clicking the HGVS checkbox.
   * Toggles the current state of the flag
   */
  @boundMethod
  handleClickHgvs() {
    const { hgvs, value } = this.state;
    this.setState({ hgvs: !hgvs });

    if (value) {
      this.handleChange({ target: { value } }, true);
    }
  }

  render() {
    const {
      value,
      hgvs,
      variantError,
      keyWordError,
    } = this.state;

    return (
      <div className="search">
        <div className="search__bar">
          <div
            className="search__main"
            onKeyUp={event => event.keyCode === ENTER_KEYCODE && this.handleSubmit()}
            role="textbox"
            tabIndex={0}
          >
            <TextField
              error={(variantError && hgvs) || keyWordError}
              fullWidth
              helperText={hgvs
                ? variantError
                : keyWordError
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment>
                    <IconButton color="primary" onClick={this.handleSubmit}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              onChange={this.handleChange}
              placeholder={hgvs
                ? 'Search Statements by HGVS Shorthand'
                : 'Search Statements by Keyword'
              }
              value={value}
            />
            <FormControlLabel
              checked={hgvs}
              color="primary"
              control={<Checkbox />}
              label={<Typography className="search__sub-search" variant="h6">HGVS Shorthand</Typography>}
              onChange={this.handleClickHgvs}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default QueryView;
