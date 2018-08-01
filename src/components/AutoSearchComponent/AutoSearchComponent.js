import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
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
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import * as jc from 'json-cycle';
import _ from 'lodash';
import api from '../../services/api';
import util from '../../services/util';

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
      loginRedirect: false,
      loading: false,
      lastRid: null,
    };
    const { property } = props;
    this.callApi = _.debounce(this.callApi.bind(this), property.length > 1 ? 600 : 300);
    this.refreshOptions = this.refreshOptions.bind(this);
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
      loginRedirect,
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
    } = this.props;

    if (loginRedirect) return <Redirect push to={{ pathname: '/login' }} />;

    const autoSearchResults = (
      inputValue,
      getItemProps,
      setState,
      getInputProps,
    ) => options.map((item, index) => children(
      getItemProps,
      item,
      index,
      setState,
      getInputProps,
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
        {(
          {
            getInputProps,
            getItemProps,
            isOpen,
            inputValue,
            setState,
          },
        ) => (
          <div className="autosearch-wrapper">
            <TextField
              disabled={disabled}
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
                  onKeyUp: this.refreshOptions,
                  onFocus: () => this.setState({ noRidFlag: false }),
                  onBlur: () => this.setState({ noRidFlag: !!(!lastRid && value) }),
                }),
                endAdornment: endAdornment ? (
                  <InputAdornment position="end">
                    {endAdornment}
                  </InputAdornment>
                ) : null,
              }}
            />
            {(isOpen || loading) && !emptyFlag
              ? (
                <Paper className="droptions">
                  <List>
                    {loading
                      ? (<CircularProgress color="primary" size={20} id="autosearch-spinner" />)
                      : autoSearchResults(inputValue, getItemProps, setState, getInputProps)}
                  </List>
                </Paper>
              ) : null}
            {emptyFlag ? (
              <Typography variant="caption" color="error">
                No Results
              </Typography>
            ) : null}
            {noRidFlag && !emptyFlag ? (
              <Typography variant="caption" color="error">
                Select an option
              </Typography>
            ) : null}
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
        {item.name || util.getPreview(item)}
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
