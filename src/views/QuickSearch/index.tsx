/**
 * @module /views/QuickSearch
 */
import './index.scss';

import kbp from '@bcgsc-pori/graphkb-parser';
import kbSchema from '@bcgsc-pori/graphkb-schema';
import {
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';

import api from '@/services/api';

const ENTER_KEYCODE = 13;
const MIN_WORD_LENGTH = 3;

/**
 * View for simple search by name query. Form submissions are passed through the URL to
 * the DataView module to handle the query transaction.
 *
 * @property {Object} props.history - Application routing history object.
 */
const QuickSearch = ({ history }) => {
  const [value, setValue] = useState('');
  const [hgvs, setHgvs] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [variant, setVariant] = useState(null);

  const searchKeyword = useCallback(() => {
    if (value && !errorMessage) {
      const payload = {
        queryType: 'keyword',
        target: 'Statement',
        keyword: value,
      };

      const search = api.encodeQueryComplexToSearch(payload, 'Statement');
      history.push({
        pathname: '/data/table',
        search,
      });
    }
  }, [errorMessage, history, value]);

  /**
   * Stringifies all queryable properties of parsed variant.
   */
  const searchByHGVS = useCallback(() => {
    if (variant) {
      const HGVSQuery = {
        target: 'Statement',
        filters: {
          conditions: { queryType: 'keyword', keyword: value, target: 'PositionalVariant' },
          operator: 'CONTAINSANY',
        },
      };

      const search = api.encodeQueryComplexToSearch(
        HGVSQuery,
        'Statement',
      );

      history.push({
        pathname: '/data/table',
        search,
      });
    }
  }, [history, value, variant]);

  /**
   * Calls submit function for currently active tab.
   */
  const handleSubmit = useCallback(() => {
    if (value) {
      if (hgvs) {
        if (variant) {
          searchByHGVS();
        }
      } else if (kbSchema.util.looksLikeRID(value)) {
        history.push({
          pathname: `/view/${value.replace(/^#/, '')}`,
        });
      } else {
        searchKeyword();
      }
    }
  }, [hgvs, history, searchByHGVS, searchKeyword, value, variant]);

  // validate
  useEffect(() => {
    if (!value) {
      setErrorMessage('');
    } else if (!hgvs) {
      const trimmed = String(value)
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length >= MIN_WORD_LENGTH);

      if (!trimmed.length) {
        setErrorMessage(`Must have 1 or more terms of at least ${MIN_WORD_LENGTH} characters`);
      } else {
        setErrorMessage('');
      }
    } else {
      try {
        const parsed = kbp.variant.parse(value);
        setErrorMessage('');
        setVariant(parsed);
      } catch (err) {
      // if it was partially parsed use that result
        if (err.content && err.content.parsed) {
          const { content: { parsed: { variantString, ...parsed } } } = err;
          setErrorMessage(`${err || err.message}`);
          setVariant(parsed);
        } else {
          setErrorMessage(`${err || err.message}`);
          setVariant(null);
        }
      }
    }
  }, [hgvs, value]);

  const handleClickHgvs = useCallback(() => {
    setHgvs(!hgvs);
  }, [hgvs]);

  const handleInputChange = useCallback((event) => {
    const newValue = event.target.value;

    if (newValue !== value) {
      setValue(newValue);
    }
  }, [value]);

  return (
    <div className="search">
      <div className="search__bar">
        <div
          className="search__main"
          onKeyUp={(event) => event.keyCode === ENTER_KEYCODE && handleSubmit()}
          role="textbox"
          tabIndex={0}
        >
          <TextField
            error={Boolean(errorMessage)}
            fullWidth
            helperText={errorMessage}
            InputProps={{
              endAdornment: (
                <InputAdornment>
                  <IconButton color="primary" onClick={handleSubmit}>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            onChange={handleInputChange}
            placeholder={hgvs
              ? 'Search Statements by HGVS Shorthand'
              : 'Search Statements by Keyword'}
            value={value}
          />
          <FormControlLabel
            checked={hgvs}
            color="primary"
            control={<Checkbox />}
            label={<Typography className="search__sub-search" variant="h6">HGVS Shorthand</Typography>}
            onChange={handleClickHgvs}
          />
        </div>
      </div>
    </div>
  );
};

QuickSearch.propTypes = {
  history: PropTypes.object.isRequired,
};

export default QuickSearch;
