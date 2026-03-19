import './index.scss';

import { Search as SearchIcon } from '@mui/icons-material';
import {
  Autocomplete, CircularProgress, ListSubheader, TextField,
} from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useDebounce } from 'use-debounce';

import api from '@/services/api';
import schema from '@/services/schema';

import DetailChip from '../DetailChip';
import { QueryBody } from '../types';
import { tuple } from '../util';

const MIN_TERM_LENGTH = 3;

const getGroup = (option) => (option.source && option.source.displayName
  ? option.source.displayName
  : 'no source');

const getAsArray = (value) => {
  if (value === null || value === undefined) { return []; }
  return Array.isArray(value) ? value : [value];
};

const valueToString = (record) => {
  if (record && record['@rid']) {
    return schema.getLabel(record, { truncate: false });
  }
  if (Array.isArray(record)) {
    return `Array(${record.length})`;
  }
  if (typeof record === 'object') {
    return JSON.stringify(record, null, 2);
  }
  return `${record}`;
};

const sortByGroup = (a, b) => {
  const gA = getGroup(a);
  const gB = getGroup(b);

  if (gA > gB) {
    return -1;
  } if (gA < gB) {
    return 1;
  }
  return 0;
};

interface RecordAutocompleteProps {
  /** function to get body of request ot /query endpoint */
  getQueryBody: (search: string) => QueryBody;
  /** the name of the field, used for propgating events */
  name: string;
  /** Additional css class name to use on the main select component */
  className?: string;
  /** flag to indicate this input is disabled */
  disabled?: boolean;
  /** Error message */
  errorText?: string;
  helperText?: string;
  /** flag to indicate this field accepts multiple records */
  isMulti?: boolean;
  /** the label for this form field */
  label?: string;
  /** the minimum length of characters required before the async options handler is called */
  minSearchLength?: number;
  /** the parent handler function */
  onChange?: (arg: { target: { name: string; value: unknown; } }) => unknown;
  /** the text placeholder for the search box */
  placeholder?: string;
  /** flag to indicate that this field must be filled */
  required?: boolean;
  /** load the initial options and do not requery */
  singleLoad?: boolean;
  /** the initial selected value(s) */
  value?: unknown[] | unknown;
}

/**
 * Autocomplete dropdown component for inputs which take 1 or multiple records as input
 */
const RecordAutocomplete = (props: RecordAutocompleteProps) => {
  const {
    className = '',
    disabled = false,
    errorText = '',
    isMulti = false,
    label = '',
    minSearchLength = 1,
    name,
    onChange,
    placeholder = 'Search Records by Name or ID',
    required = false,
    getQueryBody,
    singleLoad = false,
    helperText: initialHelperText = '',
    value,
  } = props;

  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState<boolean | null>(null);
  const selectedValues = useMemo(() => getAsArray(value), [value]);
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const helperText = useMemo(() => {
    if (searchTerm) {
      // check if there are any short terms below min length and give warning if so
      const terms = searchTerm.split(' ');
      const searchTerms = terms.filter((term) => term); // remove empty/null terms

      if (terms.length > 1) {
        const badTerms = searchTerms.filter((term) => term.length < MIN_TERM_LENGTH);

        if (badTerms.length) {
          const badLengthText = `WARNING: terms (${badTerms.join(', ')}) will be ignored in search because they are below MIN length of 3`;
          return badLengthText;
        }
      }
    }
    if ((searchTerm.length < minSearchLength && searchTerm.length >= 0 && !singleLoad) || (isFocused && isMulti && !disabled)) {
      return `Requires ${minSearchLength} or more characters to search`;
    }
    if (isFocused === false && !errorText && isMulti && !disabled) {
      return 'May take more than one value';
    }
    return initialHelperText;
  }, [disabled, errorText, initialHelperText, isFocused, isMulti, minSearchLength, searchTerm, singleLoad]);

  const searchBody = useMemo(
    () => {
      let searchTerms = '';

      if (!singleLoad) {
        const terms = debouncedSearchTerm.split(' ');
        searchTerms = terms
          .filter((term) => term)
          .filter((term) => term.length >= MIN_TERM_LENGTH)
          .join(' ');
      }
      return getQueryBody(searchTerms);
    },
    [debouncedSearchTerm, getQueryBody, singleLoad],
  );

  let enabled = !disabled;

  if (!singleLoad) {
    enabled = Boolean(enabled && debouncedSearchTerm && debouncedSearchTerm.length >= minSearchLength);
  }

  const { data: options, isLoading } = useQuery(
    tuple('/query', searchBody, { forceListReturn: true }),
    ({ queryKey: [, body] }) => api.query(body),
    {
      enabled,
      onError: (err) => {
        console.error('Error in getting the RecordAutocomplete singleLoad suggestions');
        console.error(err);
      },
      select: (response) => response.sort(sortByGroup),
    },
  );

  const handleChange = useCallback(
    (e, newValue, actionType, { option } = {}) => {
      if (actionType === 'select-option' && !isMulti) {
        onChange?.({ target: { name, value: option } });
      } else if (actionType !== 'blur') {
        onChange?.({ target: { name, value: isMulti ? newValue : (newValue[0] ?? null) } });
      }
    },
    [isMulti, name, onChange],
  );

  const handleInputChange = useCallback((e, newSearchTerm) => {
    setSearchTerm(newSearchTerm);
  }, []);

  const handleOnFocus = useCallback(
    () => {
      setIsFocused(true);
    },
    [],
  );

  const handleOnBlur = useCallback(
    () => {
      setIsFocused(false);
    },
    [],
  );

  const filterOptions = useCallback((opts, { inputValue }) => {
    if (singleLoad) {
      return opts.filter((option) => [
        option.name,
        option.sourceId,
        option.displayName,
      ].some(
        (tgt) => tgt && tgt.toLowerCase().includes(inputValue.toLowerCase()),
      ));
    }

    return opts;
  }, [singleLoad]);

  return (
    <Autocomplete
      className={`record-autocomplete ${className}`}
      disabled={disabled}
      filterOptions={filterOptions}
      filterSelectedOptions
      getOptionLabel={(option) => schema.getLabel(option)}
      groupBy={getGroup}
      isOptionEqualToValue={(option, value_) => option['@rid'] === value_['@rid']}
      loading={isLoading}
      multiple
      onBlur={handleOnBlur}
      onChange={handleChange}
      onFocus={handleOnFocus}
      onInputChange={handleInputChange}
      options={options ?? []}
      popupIcon={<SearchIcon />}
      renderGroup={(params) => [
        <ListSubheader
          key={params.key}
          className="record-autocomplete__group-title"
          component="div"
        >
          {params.group}
        </ListSubheader>,
        params.children,
      ]}
      renderInput={(params) => (
        <TextField
          {...params}
          disabled={disabled || (!isMulti && Boolean(selectedValues.length))}
          error={Boolean(errorText)}
          helperText={helperText || errorText}
          InputLabelProps={{
            shrink: !(disabled && !selectedValues.length),
          }}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
            disableUnderline: disabled || (Boolean(selectedValues.length) && !isMulti),
          }}
          label={label}
          placeholder={
                (disabled || selectedValues.length)
                  ? ''
                  : placeholder
              }
          required={required}
        />
      )}
      renderTags={(values, getTagProps) => values.map((option, index) => (
        <DetailChip
          {...getTagProps({ index })}
          className="record-autocomplete__chip record-autocomplete__chip--multi"
          details={option}
          getLink={schema.getLink}
          label={schema.getLabel(option)}
          valueToString={valueToString}
        />
      ))}
      value={selectedValues}
    />
  );
};

export default RecordAutocomplete;
