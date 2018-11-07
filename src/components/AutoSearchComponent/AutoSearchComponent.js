/**
 * @module /components/AutoSearchComponent
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './AutoSearchComponent.css';
import Downshift from 'downshift';
import {
  MenuItem,
  List,
  Paper,
  TextField,
  Typography,
  CircularProgress,
  InputAdornment,
  Popper,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import * as jc from 'json-cycle';
import debounce from 'lodash.debounce';
import RecordChip from '../RecordChip/RecordChip';
import api from '../../services/api';
import util from '../../services/util';

const DEBOUNCE_TIME = 300;

// More conservative timeout for double query call.
const LONG_DEBOUNCE_TIME = 600;

const PROGRESS_SPINNER_SIZE = 20;
const MAX_HEIGHT_FACTOR = 15;
const ACTION_KEYCODES = [13, 16, 37, 38, 39, 40];

/**
 * Autocomplete search component for querying ease of use. Text input component
 * that makes small (default limit 30) calls to the api when the user types.
 * Includes a debounce time to prevent large volumes of api calls.
 *
 * Results are displayed in a menu anchored below the input text field,
 * inheriting its width and with a max-height proportional to the specified
 * limit.
 *
 */
class AutoSearchComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      options: [],
      emptyFlag: false,
      loading: false,
    };
    const { property } = props;
    this.callApi = debounce(
      this.callApi.bind(this),
      property.length > 1 ? LONG_DEBOUNCE_TIME : DEBOUNCE_TIME,
    );
    this.handleBlur = this.handleBlur.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleClear = this.handleClear.bind(this);
    this.refreshOptions = this.refreshOptions.bind(this);
    this.setRef = (node) => { this.popperNode = node; };
  }

  /**
   * Cancels debounce method to avoid memory leaks.
   */
  componentWillUnmount() {
    this.callApi.cancel();
    this.render = null;
  }

  /**
   * Updates the parent value with a value if there is a perfect match or only
   * 1 result for the specified query string. Disabled if user is using literal
   * syntax.
   */
  handleBlur() {
    this.setState({ loading: false, options: [] });
  }

  /**
   * Updates the parent value with value from a selected item.
   * @param {Object} selectedRecord - Selected KB record.
   */
  handleChange(selectedRecord) {
    const {
      onChange,
      name,
    } = this.props;
    onChange({
      target: {
        value: selectedRecord,
        name: `${name}.data`,
      },
    });
  }

  handleClear() {
    const { name, onChange } = this.props;
    onChange({ target: { value: null, name: `${name}.data` } });
  }

  /**
   * Calls api with user input value as parameter.
   * @param {Event} e - user input event.
   */
  refreshOptions(e) {
    if (!ACTION_KEYCODES.includes(e.keyCode)) {
      const { selected } = this.state;
      const { value: propValue, name, onChange } = this.props;
      let { value } = e.target;

      if (selected) {
        value = `${propValue}${value}`;
      }
      this.handleChange(null);
      onChange({ target: { name, value } });
      this.setState({ loading: true, emptyFlag: false });
      this.callApi(value);
    }
  }

  /**
   * Queries the api endpoint specified in the component props. Matches records
   * with the property specified in component props similar to the input value.
   * @param {string} value - value to be sent to the api.
   */
  async callApi(value) {
    const {
      limit,
      endpoint,
      property,
    } = this.props;

    try {
      const response = await api.autoSearch(
        endpoint,
        property,
        value,
        limit,
      );
      const results = jc.retrocycle(response).result;
      const emptyFlag = !!(results.length === 0 && value);
      this.setState({ options: results, emptyFlag, loading: false });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  render() {
    const {
      options,
      emptyFlag,
      loading,
    } = this.state;

    const {
      children,
      name,
      placeholder,
      value,
      label,
      required,
      disabled,
      endAdornment,
      error,
      dense,
      limit,
      selected,
    } = this.props;

    const autoSearchResults = (
      getItemProps,
      setState,
      highlightedIndex,
      style,
    ) => options.map((item, index) => children(
      getItemProps,
      item,
      index,
      setState,
      style,
      highlightedIndex,
    ));

    return (
      <Downshift
        onChange={this.handleChange}
        itemToString={(item) => {
          if (item && item.name) return item.name;
          return util.castToExist(item);
        }}
      >
        {(downshiftProps) => {
          const {
            getInputProps,
            getItemProps,
            isOpen,
            setState,
            getMenuProps,
            highlightedIndex,
          } = downshiftProps;
          return (
            <div
              className="autosearch-wrapper"
              style={{ minHeight: dense ? '48px' : '64px' }}
            >
              <div className="autosearch-popper-node" ref={this.setRef}>
                <TextField
                  fullWidth
                  error={emptyFlag || error}
                  label={label}
                  required={required}
                  InputProps={{
                    ...getInputProps({
                      placeholder,
                      value: selected ? ' ' : value,
                      name,
                      disabled: disabled || selected,
                      onChange: this.refreshOptions,
                      onBlur: this.handleBlur,
                      style: {
                        fontSize: dense ? '0.8125rem' : '',
                      },
                    }),
                    disableUnderline: selected,
                    endAdornment: endAdornment ? (
                      <InputAdornment
                        position="end"
                      >
                        {endAdornment}
                      </InputAdornment>
                    ) : null,
                    startAdornment: selected
                      ? (
                        <RecordChip label={value} onDelete={this.handleClear} />
                      ) : null,
                  }}
                  helperText={emptyFlag && 'No Results'}
                  style={{
                    fontSize: dense ? '0.8125rem' : '',
                  }}
                />
              </div>
              <Popper
                open
                anchorEl={this.popperNode}
                placement="bottom-start"
              >
                {(isOpen || loading) && !emptyFlag && (
                  <div {...getMenuProps()}>
                    <Paper
                      className={`droptions ${dense ? 'dense' : ''}`}
                      style={{
                        width: this.popperNode
                          ? this.popperNode.clientWidth
                          : null,
                        maxHeight: MAX_HEIGHT_FACTOR * limit,
                      }}
                    >
                      <List dense={dense}>
                        {loading
                          ? (
                            <CircularProgress
                              color="primary"
                              size={PROGRESS_SPINNER_SIZE}
                              id="autosearch-spinner"
                            />
                          )
                          : autoSearchResults(getItemProps, setState, highlightedIndex)}
                      </List>
                    </Paper>
                  </div>)}
              </Popper>
            </div>);
        }}
      </Downshift>
    );
  }
}

/**
 * @namespace
 * @property {number} limit - database return record limit.
 * @property {string} name - name of input for event parsing.
 * @property {string} endpoint - api endpoint identifier.
 * @property {string} property - api property identifier.
 * @property {string} placeholder - placeholder for text input.
 * @property {string} value - specified value for two way binding.
 * @property {string} label - label for text input.
 * @property {bool} required - required flag for text input indicator.
 * @property {bool} error - error flag for text input.
 * @property {func} onChange - parent method for handling change events
 * @property {function} children - Function that yields the component for
 * display display query results.
 * @property {bool} disabled - disabled flag for text input.
 * @property {Object} endAdornment - component to adorn the end of input text field with.
 * @property {bool} dense - dense variant flag. If true, font sizes are decreased.
 */
AutoSearchComponent.propTypes = {
  limit: PropTypes.number,
  name: PropTypes.string,
  endpoint: PropTypes.string,
  property: PropTypes.array,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.bool,
  onChange: PropTypes.func,
  children: PropTypes.func,
  disabled: PropTypes.bool,
  endAdornment: PropTypes.object,
  dense: PropTypes.bool,
  selected: PropTypes.bool,
};

AutoSearchComponent.defaultProps = {
  limit: 30,
  endpoint: 'ontologies',
  property: ['name'],
  placeholder: '',
  name: undefined,
  value: undefined,
  label: '',
  required: false,
  error: false,
  dense: false,
  selected: false,
  children: (getItemProps, item, index, s, t, highlightedIndex) => (
    <MenuItem
      {...getItemProps({
        key: item['@rid'],
        index,
        item,
      })}
      style={{ whiteSpace: 'normal', height: 'unset' }}
      selected={highlightedIndex === index}
    >
      <span>
        {item.name || item.sourceId}
        <Typography color="textSecondary" variant="body1">
          {item.source && item.source.name ? item.source.name : ''}
        </Typography>
      </span>
    </MenuItem>
  ),
  onChange: () => { },
  disabled: false,
  endAdornment: <SearchIcon style={{ cursor: 'default' }} />,
};

export default AutoSearchComponent;
