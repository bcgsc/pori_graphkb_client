/**
 * @module /views/QueryView
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './QueryView.css';
import { Button, IconButton } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import AutoSearchComponent from '../../components/AutoSearchComponent/AutoSearchComponent';

/**
 * View for simple search by name query. Form submissions are passed through the URL to
 * the DataView module to handle the query transaction.
 */
class QueryView extends Component {
  constructor(props) {
    super(props);
    const { state } = props.history.location;
    const initName = state
      && state.mainParams
      && state.mainParams.name
      ? state.mainParams.name
      : '';

    this.state = {
      name: initName,
      disabled: false,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleInvalid = this.handleInvalid.bind(this);
  }

  /**
   * Sets redirect flag to true if there is a valid query (any string).
   */
  handleSubmit() {
    const { name, disabled } = this.state;
    const { history } = this.props;
    if (name && !disabled) {
      history.push({
        pathname: '/data/table',
        search: `?name=~${name}`,
      });
    }
  }

  /**
   * Updates state from user input.
   * @param {Event} e - user input event.
   */
  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value, disabled: false });
  }

  /**
   * Binds autosearch disabled flag to search button.
   */
  handleInvalid() {
    this.setState({ disabled: true });
  }

  render() {
    const {
      name,
    } = this.state;
    const { history } = this.props;

    return (
      <div className="search-wrapper">
        <div className="search-bar">
          <div
            className="main-search"
            onKeyUp={(e) => {
              if (e.keyCode === 13) {
                this.handleSubmit();
              }
            }}
            role="textbox"
            tabIndex={0}
          >
            <AutoSearchComponent
              value={name}
              onChange={this.handleChange}
              placeholder="Search by Name"
              limit={30}
              name="name"
              onInvalid={this.handleInvalid}
              onAction={this.handleSubmit}
              endAdornment={(
                <IconButton id="search-btn" onClick={this.handleSubmit} color="primary">
                  <SearchIcon />
                </IconButton>
              )}
            />
          </div>
        </div>
        <Button
          variant="outlined"
          color="secondary"
          className="advanced-button"
          onClick={() => history.push({ state: this.state, pathname: '/query/advanced' })}
        >
          Advanced Search
        </Button>
      </div>
    );
  }
}
/**
 * @namespace
 * @param {Object} history - Application routing history object.
 */
QueryView.propTypes = {
  history: PropTypes.object.isRequired,
};

export default QueryView;
