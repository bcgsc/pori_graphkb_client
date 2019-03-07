/**
 * @module /views/QueryView
 */
import { boundMethod } from 'autobind-decorator';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Checkbox,
  FormControlLabel,
} from '@material-ui/core';
import kbp from '@bcgsc/knowledgebase-parser';
import * as qs from 'qs';
import SearchIcon from '@material-ui/icons/Search';

import './QueryView.scss';
import { KBContext } from '../../components/KBContext';

const ENTER_KEYCODE = 13;
const MIN_WORD_LENGTH = 3;

/**
 * View for simple search by name query. Form submissions are passed through the URL to
 * the DataView module to handle the query transaction.
 *
 * @property {Object} props.history - Application routing history object.
 */
class QueryView extends Component {
  static contextType = KBContext;

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
        history.push({
          pathname: '/data/table',
          search: qs.stringify({ keyword: trimmed.join(' ') }),
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
    const { schema } = this.context;

    if (variant) {
      const params = {
        '@class': 'PositionalVariant',
      };
      ['type', 'reference1', 'reference2'].forEach((param) => {
        if (variant[param]) {
          params[param] = { name: variant[param] };
        }
      });
      schema.getProperties('PositionalVariant').filter(p => !p.name.includes('Repr')).forEach((prop) => {
        if (prop.type !== 'link' && variant[prop.name] && !prop.generated) {
          params[prop.name] = variant[prop.name];
        }
      });
      const search = qs.stringify(params);

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
    const { history } = this.props;

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
              fullWidth
              value={value}
              onChange={this.handleChange}
              placeholder={hgvs
                ? 'Search by HGVS Shorthand'
                : 'Search by Keyword'
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment>
                    <IconButton onClick={this.handleSubmit} color="primary">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              error={(variantError && hgvs) || keyWordError}
              helperText={hgvs
                ? variantError
                : keyWordError
              }
            />
            <FormControlLabel
              control={<Checkbox />}
              label="HGVS Shorthand"
              checked={hgvs}
              onChange={this.handleClickHgvs}
              color="primary"
            />
          </div>
        </div>
        <Button
          variant="outlined"
          color="secondary"
          className="search__advanced-button"
          onClick={() => history.push({ pathname: '/query/advanced' })}
        >
          Advanced Search
        </Button>
      </div>
    );
  }
}

export default QueryView;
