
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
import _ from 'lodash';
import api from '../../services/api';
import util from '../../services/util';

const DEBOUNCE_TIME = 300;

// More conservative timeout for double query call.
const LONG_DEBOUNCE_TIME = 600;

const PROGRESS_SPINNER_SIZE = 20;
const MAX_HEIGHT_FACTOR = 15;

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
      noRidFlag: false,
      loading: false,
      lastRid: null,
    };
    const { property } = props;
    this.callApi = _.debounce(
      this.callApi.bind(this),
      property.length > 1 ? LONG_DEBOUNCE_TIME : DEBOUNCE_TIME,
    );
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
   * Calls api with user input value as parameter.
   * @param {Event} e - user input event.
   */
  refreshOptions(e) {
    this.setState({ loading: true, emptyFlag: false, lastRid: null });
    this.callApi(e.target.value);
  }

  /**
   * Queries the api endpoint specified in the component props. Matches records
   * with the property specified in component props similar to the input value.
   * @param {string} value - value to be sent to the api.
   */
  callApi(value) {
    const {
      limit,
      endpoint,
      property,
    } = this.props;

    api.autoSearch(
      endpoint,
      property,
      value,
      limit,
    ).then((response) => {
      const results = jc.retrocycle(response).result;
      const emptyFlag = !!(results.length === 0 && value);
      this.setState({ options: results, emptyFlag, loading: false });
    }).catch(() => { });
  }

  render() {
    const {
      options,
      emptyFlag,
      noRidFlag,
      lastRid,
      loading,
    } = this.state;

    const {
      children,
      onChange,
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
    } = this.props;

    const autoSearchResults = (
      inputValue,
      getItemProps,
      setState,
      style,
    ) => options.map((item, index) => children(
      getItemProps,
      item,
      index,
      setState,
      style,
    ));

    return (
      <Downshift
        onChange={(e) => {
          onChange({
            target: {
              value: e.name || e.sourceId,
              sourceId: e.sourceId,
              '@rid': e['@rid'],
              name,
            },
          });
          this.setState({ lastRid: e['@rid'] });
        }}
        itemToString={(item) => {
          if (item) return item.name;
          return null;
        }}
      >
        {({
          getInputProps,
          getItemProps,
          isOpen,
          inputValue,
          setState,
          getMenuProps,
        }) => (
          <div
            className="autosearch-wrapper"
            style={{ minHeight: dense ? '48px' : '64px' }}
          >
            <div ref={this.setRef}>
              <TextField
                fullWidth
                error={emptyFlag || noRidFlag || error}
                label={label}
                required={required}
                InputProps={{
                  ...getInputProps({
                    placeholder,
                    value,
                    onChange,
                    name,
                    disabled,
                    onKeyUp: this.refreshOptions,
                    onFocus: () => this.setState({ noRidFlag: false }),
                    onBlur: () => this.setState({ noRidFlag: !!(!lastRid && value) }),
                    style: {
                      fontSize: dense ? '0.8125rem' : '',
                    },
                  }),
                  endAdornment: endAdornment ? (
                    <InputAdornment
                      position="end"
                    >
                      {endAdornment}
                    </InputAdornment>
                  ) : null,
                }}
                style={{
                  fontSize: dense ? '0.8125rem' : '',
                }}
              />
            </div>
            <Popper
              open={(isOpen || loading) && !emptyFlag}
              anchorEl={this.popperNode}
              placement="bottom-start"
              {...getMenuProps()}
            >
              <Paper
                className={`droptions ${dense ? 'dense' : ''}`}
                style={{
                  width: this.popperNode
                    ? this.popperNode.clientWidth
                    : null,
                  maxHeight: `${MAX_HEIGHT_FACTOR * limit}px`,
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
                    : autoSearchResults(inputValue, getItemProps, setState)}
                </List>
              </Paper>
            </Popper>
            {emptyFlag ? ( // Indicator for empty query
              <Typography variant="caption" color="error">
                No Results
              </Typography>
            ) : null}
            {noRidFlag && !emptyFlag && ( // Indicator for unselected option
              <Typography variant="caption" color="error">
                Select an option
              </Typography>
            )}
          </div>)
        }
      </Downshift>
    );
  }
}

AutoSearchComponent.propTypes = {
  /**
   * @param {number} limit - database return record limit.
   */
  limit: PropTypes.number,
  /**
   * @param {string} name - name of input for event parsing.
   */
  name: PropTypes.string.isRequired,
  /**
   * @param {string} endpoint - api endpoint identifier.
   */
  endpoint: PropTypes.string,
  /**
   * @param {string} property - api property identifier.
   */
  property: PropTypes.array,
  /**
   * @param {string} placeholder - placeholder for text input.
   */
  placeholder: PropTypes.string,
  /**
   * @param {string} value - specified value for two way binding.
   */
  value: PropTypes.string,
  /**
   * @param {string} label - label for text input.
   */
  label: PropTypes.string,
  /**
   * @param {bool} required - required flag for text input indicator.
   */
  required: PropTypes.bool,
  /**
   * @param {bool} error - error flag for text input.
   */
  error: PropTypes.bool,
  /**
   * @param {func} onChange - parent method for handling change events
   */
  onChange: PropTypes.func,
  /**
   * @param {function} children - Function that yields the component for
   * display display query results.
   */
  children: PropTypes.func,
  /**
   * @param {bool} disabled - disabled flag for text input.
   */
  disabled: PropTypes.bool,
  /**
   * @param {Object} endAdornment - component to adorn the end of input text field with.
   */
  endAdornment: PropTypes.object,
  /**
   * @param {bool} dense - dense variant flag. If true, font sizes are decreased.
   */
  dense: PropTypes.bool,
};

AutoSearchComponent.defaultProps = {
  limit: 30,
  endpoint: 'ontologies',
  property: ['name'],
  placeholder: '',
  value: '',
  label: '',
  required: false,
  error: false,
  dense: false,
  children: (getItemProps, item, index) => ( // TODO: change this to be more flexible
    <MenuItem
      {...getItemProps({
        key: item['@rid'],
        index,
        item,
      })}
      style={{ whiteSpace: 'normal', height: 'unset' }}
    >
      <span>
        {util.getPreview(item)}
        <Typography color="textSecondary" variant="body1">
          {item.source && item.source.name ? item.source.name : ''}
        </Typography>
      </span>
    </MenuItem>
  ),
  onChange: null,
  disabled: false,
  endAdornment: <SearchIcon />,
};

export default AutoSearchComponent;
