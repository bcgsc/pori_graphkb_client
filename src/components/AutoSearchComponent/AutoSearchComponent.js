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
} from '@material-ui/core';
import * as jc from 'json-cycle';
import * as _ from 'lodash';
import api from '../../services/api';

class AutoSearchComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      options: [],
      limit: props.limit || 30,
      endpoint: props.endpoint || 'diseases',
      property: props.property || 'name',
      error: false,
      emptyFlag: false,
    };

    this.callApi = _.debounce(this.callApi.bind(this), 300);
    this.refreshOptions = this.refreshOptions.bind(this);
  }

  componentWillUnmount() {
    this.callApi.cancel();
    this.render = null;
  }

  refreshOptions(e) {
    // Allow debouncing
    this.callApi(e.target.value);
  }

  callApi(value) {
    const { endpoint, property, limit } = this.state;
    api.autoSearch(
      endpoint,
      property,
      value,
      limit,
    ).then((response) => {
      const cycled = jc.retrocycle(response.result);
      const emptyFlag = cycled.length === 0 && value;
      this.setState({ options: cycled, error: false, emptyFlag });
    })
      .catch((error) => {
        if (error.status === 400) {
          this.setState({ error: true });
        }
      });
  }

  render() {
    const { options, error, emptyFlag } = this.state;
    const {
      children,
      onChange,
      name,
      placeholder,
      value,
      label,
      required,
    } = this.props;

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
              fullWidth
              error={error || emptyFlag}
              InputProps={{
                ...getInputProps({
                  placeholder,
                  value,
                  onChange,
                  name,
                  label,
                  onKeyUp: this.refreshOptions,
                  required,
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
};

AutoSearchComponent.propTypes = {
  limit: PropTypes.number,
  endpoint: PropTypes.string,
  property: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool,
  children: PropTypes.func,
};

export default AutoSearchComponent;
