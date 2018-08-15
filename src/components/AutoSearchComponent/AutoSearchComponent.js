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

/**
 * Autocomplete search component for querying ease of use.
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
   * Calls debounced api call with user input value as parameter.
   * @param {Event} e - user input event.
   */
  refreshOptions(e) {
    this.setState({ loading: true, emptyFlag: false, lastRid: null });
    this.callApi(e.target.value);
  }

  /**
   * Calls the api to and sets the state to show returned records, and to set error flags.
   * @param {string} value - query value to be sent to the api.
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
      const results = [];
      response.forEach((query) => {
        const cycled = jc.retrocycle(query.result);
        results.push(...cycled);
      });
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
                className="droptions"
                style={{
                  width: this.popperNode
                    ? this.popperNode.clientWidth
                    : null,
                }}
              >
                <List dense={dense}>
                  {loading
                    ? (<CircularProgress color="primary" size={PROGRESS_SPINNER_SIZE} id="autosearch-spinner" />)
                    : autoSearchResults(inputValue, getItemProps, setState)}
                </List>
              </Paper>
            </Popper>
            {emptyFlag ? (
              <Typography variant="caption" color="error">
                No Results
              </Typography>
            ) : null}
            {noRidFlag && !emptyFlag && (
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

/**
* @param {number} limit - entry number limit when querying the database.
* @param {string} name - name of input for event parsing.
* @param {string} endpoint - api endpoint identifier.
* @param {string} property - api property identifier.
* @param {string} placeholder - placeholder for text input.
* @param {string} value - specified value for two way binding.
* @param {string} label - label for text input.
* @param {bool} required - required flag for text input indicator.
* @param {func} onChange - parent method for handling change events
* @param {func} children - component for display display query results.
* @param {bool} disabled - disabled flag.
  */
AutoSearchComponent.propTypes = {
  limit: PropTypes.number,
  name: PropTypes.string.isRequired,
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
