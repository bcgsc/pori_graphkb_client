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
} from '@material-ui/core';
import * as jc from 'json-cycle';
import * as _ from 'lodash';
import api from '../../services/api';

/**
 * Autocomplete search component for querying ease of use.
 */
class AutoSearchComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      options: [],
      error: false,
      emptyFlag: false,
      loginRedirect: false,
    };

    this.callApi = _.debounce(this.callApi.bind(this), 300);
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
    this.callApi(e.target.value);
  }

  /**
   * Calls the api to and sets the state to show returned records, and to set error flags.
   * @param {string} value - query value to be sent to the api.
   */
  callApi(value) {
    const { endpoint, property, limit } = this.props;
    api.autoSearch(
      endpoint,
      property,
      value,
      limit,
    ).then((response) => {
      const cycled = jc.retrocycle(response.result);
      const emptyFlag = !!(cycled.length === 0 && value);
      this.setState({ options: cycled, error: false, emptyFlag });
    })
      .catch((error) => {
        if (error.status === 401) {
          this.setState({ loginRedirect: true });
        } else if (error.status === 400) {
          this.setState({ error: true });
        }
      });
  }

  render() {
    const {
      options,
      error,
      emptyFlag,
      loginRedirect,
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
            target: { value: e.name, '@rid': e['@rid'], name }, // TODO: sourceID variant
          });
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
              error={error || emptyFlag}
              label={label}
              required={required}
              InputProps={{
                ...getInputProps({
                  placeholder,
                  value,
                  onChange,
                  name,
                  onKeyUp: this.refreshOptions,
                }),
              }}
            />
            {isOpen
              && autoSearchResults(inputValue, getItemProps, setState, getInputProps)
                .length !== 0
              ? (
                <Paper className="droptions">
                  <List>
                    {autoSearchResults(inputValue, getItemProps, setState, getInputProps)}
                  </List>
                </Paper>
              ) : null}
            {error ? (
              <Typography variant="caption" color="error">
                Invalid Request
              </Typography>
            ) : null
            }
            {emptyFlag ? (
              <Typography variant="caption" color="error">
                No Results
              </Typography>
            ) : null}
          </div>)
        }
      </Downshift>
    );
  }
}

AutoSearchComponent.defaultProps = {
  limit: 30,
  endpoint: 'diseases',
  property: 'name',
  placeholder: '',
  value: '',
  label: '',
  required: false,
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
        {item.name}
        <Typography color="textSecondary" variant="body1">
          {item.source && item.source.name ? item.source.name : ''}
        </Typography>
      </span>
    </MenuItem>
  ),
  onChange: null,
  disabled: false,
};

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
  property: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool,
  onChange: PropTypes.func,
  children: PropTypes.func,
  disabled: PropTypes.bool,
};

export default AutoSearchComponent;
