import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, Redirect } from 'react-router-dom';
import './QueryView.css';
import { Button, Snackbar } from '@material-ui/core';
import AutoSearchComponent from '../../components/AutoSearchComponent/AutoSearchComponent';

/**
 * View representing the simple query page and the entry point into querying the database.
 */
class QueryView extends Component {
  constructor(props) {
    super(props);

    const initName = props.location.state
      && props.location.state.mainParams
      && props.location.state.mainParams.name
      ? props.location.state.mainParams.name
      : '';


    this.state = {
      name: initName,
      redirect: false,
      endpoint: 'table',
      prevEmpty: props.location.state && props.location.state.noResults,
      disabled: false,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleInvalid = this.handleInvalid.bind(this);
  }

  /**
   * Sets redirect flag to true if there is a valid query (any string).
   */
  handleSubmit(endpoint) {
    const { name, disabled } = this.state;
    if (name && !disabled) this.setState({ redirect: true, endpoint });
  }

  /**
   * Updates state from user input.
   * @param {Event} e - user input event.
   */
  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value, disabled: false });
  }

  /**
   * Closes "no results" snackbar.
   */
  handleClose() {
    this.setState({ prevEmpty: false });
  }

  /**
   * Binds autosearch disabled flag to search button.
   */
  handleInvalid() {
    this.setState({ disabled: true });
  }

  render() {
    const {
      redirect,
      endpoint,
      name,
      prevEmpty,
    } = this.state;

    if (redirect) {
      return (
        <Redirect
          push
          to={{
            pathname: `/data/${endpoint}`,
            search: `?name=~${name}`,
          }}
        />
      );
    }

    return (
      <div className="search-wrapper">
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={prevEmpty}
          onClose={this.handleClose}
          autoHideDuration={3000}
          message={(
            <span>
              No results found
            </span>
          )}
        />
        <div className="search-bar">
          <div
            className="main-search"
            onKeyUp={(e) => {
              if (e.keyCode === 13) {
                this.handleSubmit('table');
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
            />
          </div>
          <div className="search-buttons">
            <Button
              variant="raised"
              color="primary"
              onClick={() => {
                this.handleSubmit('table');
              }}
            >
              Search
            </Button>
          </div>
        </div>
        <Link
          className="query-link"
          to={{ state: this.state, pathname: '/query/advanced' }}
        >
          <Button
            variant="outlined"
            color="secondary"
            className="advanced-button"
          >
            Advanced Search
          </Button>
        </Link>
      </div>
    );
  }
}

/**
 * @param {Object} location - location property for the route and passed state.
 */
QueryView.propTypes = {
  location: PropTypes.object.isRequired,
};

export default QueryView;
