import React from 'react';
import PropTypes from 'prop-types';
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
  * @property {object} props.components components to be passed to react-select
  * @property {object} props.DetailChipProps properties to be applied to the DetailChip
  * @property {boolean} props.disabled flag to indicate this input is disabled
  * @property {boolean} props.isMulti flag to indicate this field accepts multiple records
  * @property {function} props.itemToString function to convert option objects to display label
  * @property {string} props.label the label for this form field
  * @property {Number} props.minSearchLength the minimum length of characters required before the async options handler is called
  * @property {string} props.name the name of the field, used for propgating events
  * @property {function} props.onChange the parent handler function
  * @property {string} props.placeholder the text placeholder for the search box
  * @property {searchHandler} props.searchHandler the function to create the async options call
  * @property {object|Array.<object>} props.value the initial selected value(s)
  * @property {Number} props.debounceMs the ms to use in setting the debounce on calling getting options (id 0 then no debounce is set)
  */
class RecordAutocomplete extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    components: PropTypes.object,
    DetailChipProps: PropTypes.object,
    disabled: PropTypes.bool,
    isMulti: PropTypes.bool,
    itemToString: PropTypes.func,
    label: PropTypes.string,
    minSearchLength: PropTypes.number,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    searchHandler: PropTypes.func.isRequired,
    value: PropTypes.object,
    debounceMs: PropTypes.number,
  };

  static defaultProps = {
    className: '',
    components: defaultComponents,
    DetailChipProps: {},
    disabled: false,
    isMulti: false,
    itemToString: opt => opt.name,
    label: '',
    minSearchLength: 4,
    onChange: () => {},
    placeholder: 'Search for an Existing Record',
    value: null,
    debounceMs: 300,
  };

  constructor(props) {
    super(props);
    const { value } = props;
    const { debounceMs } = this.props;
    this.state = {
      selected: value,
      helperText: false,
    };
    this.controller = null; // store the request/abort object to handle the async option call
    if (debounceMs < 0) {
      this.getOptions = this.getOptions.bind(this);
    } else {
      // wrap in a debouncer to avoid spamming the api
      this.getOptions = debounce(this.getOptions.bind(this), debounceMs);
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

  async getOptions(term) {
    const { minSearchLength, searchHandler } = this.props;

    if (term.length >= minSearchLength) {
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
      disabled,
      itemToString,
      label,
      placeholder,
      isMulti,
      components,
      DetailChipProps,
    } = this.props;

    const {
      helperText,
      selected,
    } = this.state;

    return (
      <div className={`record-autocomplete ${className}`}>
        <NoSsr>
          <AsyncSelect
            value={selected}
            cacheOptions
            loadOptions={this.getOptions}
            components={components}
            onChange={this.handleChange}
            onInputChange={this.handleInputChange}
            getOptionValue={v => v} // default looks for value property
            getOptionLabel={itemToString}
            textFieldProps={{
              InputProps: {
                disabled: disabled || !!selected,
                disableUnderline: disabled || !!selected,
              },
              error: !!helperText,
              helperText,
              InputLabelProps: {
                shrink: !!selected || !(disabled && !selected),
              },
              label,
            }}
            DetailChipProps={DetailChipProps}
            isMulti={isMulti}
            placeholder={
              disabled
                ? ''
                : placeholder
            }
            isClearable={!disabled}
            isSearchable={!disabled}
          />
        </NoSsr>
      </div>
    );
  }
}

export default RecordAutocomplete;
