import React, {
  useState, useCallback, useEffect,
} from 'react';
import { NoSsr } from '@material-ui/core';
import PropTypes from 'prop-types';
import Select from 'react-select';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { useDebounce } from 'use-debounce';

import defaultComponents from './components';
import './index.scss';

/**
 * @typedef {function} searchHandlerRequest
 * @param {string} searchTermValue the term to search for
 * @returns {Promise.<Array.<object>>} the list of records suggested
 */

/**
 * @typedef {function} searchHandler
 * @param {string} term the term to search
 * @returns {ApiCall} an instance of api call which implements the abort and request functions
 */


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
  * @property {searchHandler} props.searchHandler the function to create the async options call
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
    label,
    minSearchLength,
    name,
    onChange,
    placeholder,
    required,
    searchHandler,
    singleLoad,
    value,
  } = props;

  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const [helperText, setHelperText] = useState('');
  const [selectedValue, setSelectedValue] = useState(value);
  const [debouncedSearchTerm] = useDebounce(searchTerm, debounceMs);

  // update the selected value if the initial input value changes
  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  // initial load handler
  useDeepCompareEffect(
    () => {
      let controller;
      const getOptions = async () => {
        if (controller) {
          // if there is already a request being executed  abort it and make a new one
          controller.abort();
          setIsLoading(false);
        }
        controller = searchHandler('');
        try {
          setIsLoading(true);
          const result = await controller.request();
          setOptions(result || []);
          setIsLoading(false);
        } catch (err) {
          console.error('Error in getting the RecordAutocomplete singleLoad suggestions');
          console.error(err);
          setIsLoading(false);
        }
      };

      if (singleLoad && !disabled) {
        getOptions();
      }
      return () => controller && controller.abort();
    },
    [disabled, searchHandler, singleLoad], // componentDidMount equivalent
  );

  // fetch options based on the current search term
  useDeepCompareEffect(
    () => {
      let controller;
      const getOptions = async () => {
        if (debouncedSearchTerm && debouncedSearchTerm.length >= minSearchLength) {
          if (controller) {
            // if there is already a request being executed  abort it and make a new one
            controller.abort();
            setIsLoading(false);
          }
          controller = searchHandler(debouncedSearchTerm);
          try {
            setIsLoading(true);
            const result = await controller.request();
            setOptions(result);
            setIsLoading(false);
          } catch (err) {
            console.error('Error in getting the RecordAutocomplete suggestions');
            console.error(err);
            setIsLoading(false);
          }
          controller = null;
        } else {
          setOptions([]);
        }
      };
      if (!singleLoad) {
        getOptions();
      }
      return () => controller && controller.abort();
    },
    [debouncedSearchTerm, minSearchLength, searchHandler, singleLoad], // Only call effect if debounced search term changes
  );

  const handleChange = useCallback(
    (newValue, { action: actionType }) => {
      setSelectedValue(newValue);
      const event = { target: { name, value: newValue } };
      if (actionType === 'select-option' || actionType === 'clear') {
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
        value={selectedValue}
        components={components}
        DetailChipProps={DetailChipProps}
        error={Boolean(errorText)}
        onChange={handleChange}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        inputValue={searchTerm}
        onInputChange={handleInputChange}
        getOptionValue={getOptionKey} // used to compare options for equality
        getOptionLabel={getOptionLabel} // generates the string representation
        hideSelectedOptions
        isClearable={!disabled}
        filterOption={optionFilter}
        isLoading={isLoading}
        isMulti={isMulti}
        isSearchable={!disabled}
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
        options={options}
      />
    </NoSsr>
  );
};

RecordAutocomplete.propTypes = {
  className: PropTypes.string,
  components: PropTypes.object,
  debounceMs: PropTypes.number,
  DetailChipProps: PropTypes.object,
  disabled: PropTypes.bool,
  errorText: PropTypes.string,
  getOptionKey: PropTypes.func,
  getOptionLabel: PropTypes.func,
  isMulti: PropTypes.bool,
  label: PropTypes.string,
  minSearchLength: PropTypes.number,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  searchHandler: PropTypes.func.isRequired,
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
  label: '',
  minSearchLength: 1,
  onChange: () => {},
  placeholder: 'Search Records by Name or ID',
  required: false,
  singleLoad: false,
  value: null,
};

export default RecordAutocomplete;
