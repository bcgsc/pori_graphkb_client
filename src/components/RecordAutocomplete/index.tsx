import './index.scss';

import { CircularProgress, ListSubheader, TextField } from '@material-ui/core';
import { Search as SearchIcon } from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';
import PropTypes from 'prop-types';
import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { useQuery } from 'react-query';
import { useDebounce } from 'use-debounce';

import api from '@/services/api';
import schema from '@/services/schema';

import DetailChip from '../DetailChip';
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
    return schema.getLabel(record, false);
  }
  if (Array.isArray(record)) {
    return `Array(${record.length})`;
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

/**
 * Autocomplete dropdown component for inputs which take 1 or multiple records as input
 *
 * @property {object} props
 * @property {boolean} props.disabled flag to indicate this input is disabled
 * @property {boolean} props.isMulti flag to indicate this field accepts multiple records
 * @property {boolean} props.required flag to indicate that this field must be filled
 * @property {function} props.itemToString function to convert option objects to display label
 * @property {function} props.onChange the parent handler function
 * @property {Number} props.minSearchLength the minimum length of characters required before the async options handler is called
 * @property {object|Array.<object>} props.value the initial selected value(s)
 * @property {Function} props.getQueryBody function to get body of request ot /query endpoint
 * @property {string} props.className Additional css class name to use on the main select component
 * @property {string} props.errorText Error message
 * @property {string} props.label the label for this form field
 * @property {string} props.name the name of the field, used for propgating events
 * @property {string} props.placeholder the text placeholder for the search box
 * @property {boolean} props.singleLoad load the initial options and do not requery
 */
const RecordAutocomplete = (props) => {
  const {
    className,
    disabled,
    errorText,
    isMulti,
    label,
    minSearchLength,
    name,
    onChange,
    placeholder,
    required,
    getQueryBody,
    singleLoad,
    helperText: initialHelperText,
    value,
  } = props;

  const [searchTerm, setSearchTerm] = useState('');
  const [helperText, setHelperText] = useState(initialHelperText);
  const [selectedValues, setSelectedValues] = useState(getAsArray(value));
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  // update the selected value if the initial input value changes
  useEffect(() => {
    setSelectedValues(getAsArray(value));
  }, [value]);

  // check if there are any short terms below min length and give warning if so
  useEffect(() => {
    if (searchTerm) {
      const terms = searchTerm.split(' ');
      const searchTerms = terms.filter((term) => term); // remove empty/null terms

      if (terms.length > 1) {
        const badTerms = searchTerms.filter((term) => term.length < MIN_TERM_LENGTH);

        if (badTerms.length) {
          const badLengthText = `WARNING: terms (${badTerms.join(', ')}) will be ignored in search because they are below MIN length of 3`;
          setHelperText(badLengthText);
        }
      }
    }
  }, [searchTerm]);

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
    ({ queryKey: [_, body] }) => api.query(body),
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
      setSelectedValues(newValue);

      if (actionType === 'select-option' && !isMulti) {
        setSelectedValues(isMulti ? newValue : [option]);
        onChange({ target: { name, value: option } });
      } else {
        setSelectedValues(newValue);

        if (actionType !== 'blur') {
          onChange({ target: { name, value: isMulti ? newValue : (newValue[0] ?? null) } });
        }
      }
    },
    [isMulti, name, onChange],
  );

  const handleInputChange = useCallback((e, newSearchTerm) => {
    const newHelperText = (newSearchTerm.length < minSearchLength && newSearchTerm.length >= 0 && !singleLoad)
      ? `Requires ${minSearchLength} or more characters to search`
      : '';

    setHelperText(newHelperText);
    setSearchTerm(newSearchTerm);
  }, [minSearchLength, singleLoad]);

  const handleOnFocus = useCallback(
    () => {
      if (isMulti && !disabled) {
        setHelperText(`Requires ${minSearchLength} or more characters to search`);
      }
    },
    [disabled, isMulti, minSearchLength],
  );

  const handleOnBlur = useCallback(
    () => {
      if (!errorText && isMulti && !disabled) {
        setHelperText('May take more than one value');
      }
    },
    [disabled, errorText, isMulti],
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
      getOptionSelected={(option, value_) => option['@rid'] === value_['@rid']}
      groupBy={getGroup}
      ListboxProps={{
        dense: true,
      }}
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

RecordAutocomplete.propTypes = {
  getQueryBody: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  errorText: PropTypes.string,
  helperText: PropTypes.string,
  isMulti: PropTypes.bool,
  label: PropTypes.string,
  minSearchLength: PropTypes.number,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  singleLoad: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.arrayOf(PropTypes.object)]),
};

RecordAutocomplete.defaultProps = {
  className: '',
  disabled: false,
  errorText: '',
  isMulti: false,
  label: '',
  minSearchLength: 1,
  onChange: () => {},
  placeholder: 'Search Records by Name or ID',
  required: false,
  singleLoad: false,
  value: null,
  helperText: '',
};

export default RecordAutocomplete;
