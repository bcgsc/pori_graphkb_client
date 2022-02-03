import './index.scss';

import { NoSsr } from '@material-ui/core';
import PropTypes from 'prop-types';
import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { useQuery } from 'react-query';
import Select from 'react-select';
import { useDebounce } from 'use-debounce';

import api from '@/services/api';

import defaultComponents from './components';

const MIN_TERM_LENGTH = 3;

const defaultOptionGrouping = (rawOptions) => {
  const sourceGroups = {};

  rawOptions.forEach((option) => {
    const source = option.source && option.source.displayName
      ? option.source.displayName
      : 'no source';
    sourceGroups[source] = sourceGroups[source] || [];
    sourceGroups[source].push(option);
  });

  if (Object.keys(sourceGroups) < 2) {
    return rawOptions;
  }

  const options = [];
  Object.entries(sourceGroups).forEach(([key, group]) => {
    options.push({
      label: key,
      options: group,
    });
  });
  return options;
};


/**
  * Autocomplete dropdown component for inputs which take 1 or multiple records as input
  *
  * @property {object} props
  * @property {boolean} props.disabled flag to indicate this input is disabled
  * @property {boolean} props.isMulti flag to indicate this field accepts multiple records
  * @property {boolean} props.required flag to indicate that this field must be filled
  * @property {function} props.getOptionKey function to be used in generating a key for comparing options to check if equal
  * @property {function} props.getOptionLabel function to get the string representation of the option
  * @property {function} props.itemToString function to convert option objects to display label
  * @property {function} props.onChange the parent handler function
  * @property {Number} props.debounceMs the ms to use in setting the debounce on calling getting options (id 0 then no debounce is set)
  * @property {Number} props.minSearchLength the minimum length of characters required before the async options handler is called
  * @property {object} props.components components to be passed to react-select
  * @property {object} props.DetailChipProps properties to be applied to the DetailChip
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
    components,
    DetailChipProps,
    debounceMs,
    disabled,
    errorText,
    getOptionKey,
    getOptionLabel,
    isMulti,
    innerProps,
    label,
    minSearchLength,
    name,
    onChange,
    placeholder,
    required,
    getQueryBody,
    singleLoad,
    helperText: initialHelperText,
    groupOptions,
    value,
  } = props;

  const [searchTerm, setSearchTerm] = useState('');
  const [helperText, setHelperText] = useState(initialHelperText);
  const [selectedValue, setSelectedValue] = useState(value);
  const [debouncedSearchTerm] = useDebounce(searchTerm, debounceMs);

  // update the selected value if the initial input value changes
  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  // check if there are any short terms below min length and give warning if so
  useEffect(() => {
    if (searchTerm) {
      const terms = searchTerm.split(' ');
      const searchTerms = terms.filter(term => term); // remove empty/null terms

      if (terms.length > 1) {
        const badTerms = searchTerms.filter(term => term.length < MIN_TERM_LENGTH);

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
          .filter(term => term)
          .filter(term => term.length >= MIN_TERM_LENGTH)
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

  const { data: ungroupedOptions, isLoading } = useQuery(
    ['/query', searchBody, { forceListReturn: true }],
    (route, body, opts) => api.post(route, body, opts).request(),
    {
      enabled,
      onError: (err) => {
        console.error('Error in getting the RecordAutocomplete singleLoad suggestions');
        console.error(err);
      },
    },
  );

  const options = useMemo(() => groupOptions(ungroupedOptions ?? []), [groupOptions, ungroupedOptions]);

  const handleChange = useCallback(
    (newValue, { action: actionType }) => {
      setSelectedValue(newValue);
      const event = { target: { name, value: newValue } };

      if (actionType === 'select-option' || actionType === 'clear' || actionType === 'remove-value') {
        onChange(event);
      }
    },
    [name, onChange],
  );

  const handleInputChange = useCallback(
    (newSearchTerm, { action: actionType }) => {
      let newHelperText = newSearchTerm.length < minSearchLength && newSearchTerm.length >= 0
        ? `Requires ${minSearchLength} or more characters to search`
        : '';

      if (actionType === 'input-change') {
        setHelperText(newHelperText);
      } else if (actionType === 'set-value' && isMulti) {
        newHelperText = `Requires ${minSearchLength} or more characters to search`;
        setHelperText(newHelperText);
      }
      setSearchTerm(newSearchTerm);
    },
    [isMulti, minSearchLength],
  );

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

  const optionFilter = (option, candidate) => {
    if (candidate && singleLoad) {
      return [
        option.label,
        option.data.name,
        option.data.sourceId,
        option.displayName,
      ].some(
        tgt => tgt && tgt.toLowerCase().includes(candidate.toLowerCase()),
      );
    }
    return true;
  };

  return (
    <NoSsr>
      <Select
        className={`record-autocomplete ${className}`}
        components={components}
        DetailChipProps={DetailChipProps}
        error={Boolean(errorText)}
        filterOption={optionFilter}
        getOptionLabel={getOptionLabel}
        getOptionValue={getOptionKey}
        hideSelectedOptions
        innerProps={innerProps}
        inputValue={searchTerm}
        isClearable={!disabled}
        isLoading={isLoading} // used to compare options for equality
        isMulti={isMulti} // generates the string representation
        isSearchable={!disabled}
        onBlur={handleOnBlur}
        onChange={handleChange}
        onFocus={handleOnFocus}
        onInputChange={handleInputChange}
        options={options}
        placeholder={
            disabled
              ? ''
              : placeholder
          }
        textFieldProps={{
          InputProps: {
            disabled: (disabled || Boolean(selectedValue)) && !isMulti,
            disableUnderline: disabled || (Boolean(selectedValue) && !isMulti),
          },
          error: Boolean(errorText),
          helperText: helperText || errorText,
          InputLabelProps: {
            shrink: Boolean(selectedValue) || !(disabled && !selectedValue),
          },
          required,
          label,
        }}
        value={selectedValue}
      />
    </NoSsr>
  );
};

RecordAutocomplete.propTypes = {
  getQueryBody: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  DetailChipProps: PropTypes.shape({
    getLink: PropTypes.func,
    valueToString: PropTypes.func,
  }),
  className: PropTypes.string,
  components: PropTypes.shape({
    Control: PropTypes.func,
    DropdownIndicator: PropTypes.func,
    Menu: PropTypes.func,
    MultiValue: PropTypes.func,
    NoOptionsMessage: PropTypes.func,
    Option: PropTypes.func,
    Placeholder: PropTypes.func,
    SingleValue: PropTypes.func,
    ValueContainer: PropTypes.func,
    inputComponent: PropTypes.func,
  }),
  debounceMs: PropTypes.number,
  disabled: PropTypes.bool,
  errorText: PropTypes.string,
  getOptionKey: PropTypes.func,
  getOptionLabel: PropTypes.func,
  groupOptions: PropTypes.func,
  helperText: PropTypes.string,
  innerProps: PropTypes.object,
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
  components: defaultComponents,
  debounceMs: 300,
  DetailChipProps: {
    valueToString: (record) => {
      if (record && record['@rid']) {
        return record['@rid'];
      }
      return `${record}`;
    },
  },
  disabled: false,
  errorText: '',
  getOptionKey: opt => opt['@rid'],
  getOptionLabel: opt => opt.name,
  isMulti: false,
  innerProps: {},
  label: '',
  minSearchLength: 1,
  onChange: () => {},
  placeholder: 'Search Records by Name or ID',
  required: false,
  singleLoad: false,
  value: null,
  helperText: '',
  groupOptions: defaultOptionGrouping,
};

export default RecordAutocomplete;
