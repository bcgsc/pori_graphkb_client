import './index.scss';

import { parseVariant } from '@bcgsc-pori/graphkb-parser';
import { util } from '@bcgsc-pori/graphkb-schema';
import SearchIcon from '@mui/icons-material/Search';
import {
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '@/services/api';

const ENTER_KEYCODE = 13;
const MIN_WORD_LENGTH = 3;

/**
 * View for simple search by name query. Form submissions are passed through the URL to
 * the DataView module to handle the query transaction.
 */
const QuickSearch = () => {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [hgvs, setHgvs] = useState(false);

  // validate
  const { variant, errorMessage } = useMemo(() => {
    const next = { variant: null as null | ReturnType<typeof parseVariant>, errorMessage: '' };

    if (value && !hgvs) {
      const trimmed = String(value)
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length >= MIN_WORD_LENGTH);

      if (!trimmed.length) {
        next.errorMessage = `Must have 1 or more terms of at least ${MIN_WORD_LENGTH} characters`;
      }
    } else {
      try {
        next.variant = parseVariant(value);
      } catch (err: any) {
        // if it was partially parsed use that result
        next.errorMessage = `${err || err.message}`;

        if (err.content && err.content.parsed) {
          const { content: { parsed: { variantString, ...parsed } } } = err;
          next.variant = parsed;
        }
      }
    }
    return next;
  }, [hgvs, value]);

  const searchKeyword = useCallback(() => {
    if (value && !errorMessage) {
      const payload = {
        queryType: 'keyword',
        target: 'Statement',
        keyword: value,
      };

      const search = api.encodeQueryComplexToSearch(payload, 'Statement');
      navigate({
        pathname: '/data/table',
        search,
      });
    }
  }, [errorMessage, navigate, value]);

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

      navigate({
        pathname: '/data/table',
        search,
      });
    }
  }, [navigate, value, variant]);

  /**
   * Calls submit function for currently active tab.
   */
  const handleSubmit = useCallback(() => {
    if (value) {
      if (hgvs) {
        if (variant) {
          searchByHGVS();
        }
      } else if (util.looksLikeRID(value)) {
        navigate({
          pathname: `/view/${value.replace(/^#/, '')}`,
        });
      } else {
        searchKeyword();
      }
    }
  }, [hgvs, navigate, searchByHGVS, searchKeyword, value, variant]);

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
                <InputAdornment position="end">
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

export default QuickSearch;
