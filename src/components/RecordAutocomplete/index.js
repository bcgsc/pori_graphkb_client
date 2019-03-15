import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import AsyncSelect from 'react-select/lib/Async';
import debounce from 'debounce-promise';
import {
  NoSsr,
} from '@material-ui/core';
import { boundMethod } from 'autobind-decorator';

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
  */
class RecordAutocomplete extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    components: PropTypes.object,
    debounceMs: PropTypes.number,
    defaultOptionsHandler: PropTypes.func,
    DetailChipProps: PropTypes.object,
    disableCache: PropTypes.bool,
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
    value: PropTypes.oneOfType([PropTypes.object, PropTypes.arrayOf(PropTypes.object)]),
  };

  static defaultProps = {
    className: '',
    components: defaultComponents,
    debounceMs: 300,
    defaultOptionsHandler: null,
    DetailChipProps: {
      valueToString: (record) => {
        if (record && record['@rid']) {
          return record['@rid'];
        }
        return `${record}`;
      },
    },
    disableCache: false,
    disabled: false,
    errorText: '',
    getOptionKey: opt => opt['@rid'],
    getOptionLabel: opt => opt.name,
    isMulti: false,
    label: '',
    minSearchLength: 4,
    onChange: () => {},
    placeholder: 'Search Records by Name or ID',
    required: false,
    value: null,
  };

  constructor(props) {
    super(props);
    const { value } = props;
    const { debounceMs } = this.props;
    this.state = {
      selected: value,
      helperText: false,
      initialOptions: [],
    };
    this.controller = null; // store the request/abort object to handle the async option call
    if (debounceMs < 0) {
      this.getOptions = this.getOptions.bind(this);
    } else {
      // wrap in a debouncer to avoid spamming the api
      this.getOptions = debounce(this.getOptions.bind(this), debounceMs);
    }
  }

  async componentDidMount() {
    const { searchHandler, minSearchLength, defaultOptionsHandler } = this.props;
    if (minSearchLength === 0) {
      this.controller = searchHandler('');
      const initialOptions = await this.controller.request();
      this.setState({ initialOptions });
    } else if (defaultOptionsHandler) {
      this.controller = defaultOptionsHandler();
      const initialOptions = await this.controller.request();
      this.setState({ initialOptions });
    }
  }

  componentDidUpdate(prevProps) {
    const { value } = this.props;

    if (prevProps.value !== value) {
      this.setState({ selected: value }); // eslint-disable-line react/no-did-update-set-state
    }
  }

  componentWillUnmount() {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  async getOptions(term = '') {
    const { minSearchLength, searchHandler } = this.props;

    if (term.length >= minSearchLength) {
      if (this.controller) {
        // if there is already a request being executed  abort it and make a new one
        this.controller.abort();
      }
      this.controller = searchHandler(term);
      try {
        const result = await this.controller.request();
        return result;
      } catch (err) {
        console.error('Error in getting the RecordAutocomplete suggestions');
        console.error(err);
      }
    }
    return [];
  }

  @boundMethod
  handleChange(value, { action: actionType }) {
    const { onChange, name } = this.props;
    this.setState({
      selected: value,
    });
    const event = { target: { name, value } };
    if (actionType === 'select-option' || actionType === 'clear') {
      onChange(event);
    }
  }

  @boundMethod
  handleInputChange(term, { action: actionType }) {
    const { minSearchLength, isMulti } = this.props;
    const helperText = term.length < minSearchLength && term.length > 0
      ? `Requires ${minSearchLength} or more characters to search`
      : '';
    if (actionType === 'input-change') {
      this.setState({ helperText });
      if (!isMulti) {
        this.handleChange(null, { action: 'clear' });
      }
    }
  }

  render() {
    const {
      className,
      components,
      DetailChipProps,
      disableCache,
      disabled,
      errorText,
      getOptionKey,
      getOptionLabel,
      isMulti,
      label,
      minSearchLength,
      placeholder,
      required,
    } = this.props;

    const {
      helperText,
      selected,
      initialOptions,
    } = this.state;

    let BaseSelectComponent;
    let uniqueProps;

    if (minSearchLength === 0) {
      BaseSelectComponent = Select;
      uniqueProps = { options: initialOptions };
    } else {
      // Async requests
      BaseSelectComponent = AsyncSelect;
      uniqueProps = {
        loadOptions: this.getOptions,
      };
      if (initialOptions) {
        uniqueProps.defaultOptions = initialOptions;
      }
    }

    return (
      <NoSsr>
        <BaseSelectComponent
          className={`record-autocomplete ${className}`}
          value={selected}
          cacheOptions={!disableCache}
          components={components}
          DetailChipProps={DetailChipProps}
          error={Boolean(errorText)}
          onChange={this.handleChange}
          onInputChange={this.handleInputChange}
          getOptionValue={getOptionKey} // used to compare options for equality
          getOptionLabel={getOptionLabel} // generates the string representation
          hideSelectedOptions
          isClearable={!disabled}
          isMulti={isMulti}
          isSearchable={!disabled}
          placeholder={
              disabled
                ? ''
                : placeholder
            }
          textFieldProps={{
            InputProps: {
              disabled: disabled || Boolean(selected),
              disableUnderline: disabled || (Boolean(selected) && !isMulti),
            },
            error: Boolean(helperText || errorText),
            helperText: helperText || errorText,
            InputLabelProps: {
              shrink: Boolean(selected) || !(disabled && !selected),
            },
            required,
            label,
          }}
          {...uniqueProps}
        />
      </NoSsr>
    );
  }
}

export default RecordAutocomplete;
