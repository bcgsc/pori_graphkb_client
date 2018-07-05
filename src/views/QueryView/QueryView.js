import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, Redirect } from 'react-router-dom';
import './QueryView.css';
import { Button, IconButton } from '@material-ui/core';
import ViewListIcon from '@material-ui/icons/ViewList';
import TimelineIcon from '@material-ui/icons/Timeline';
import AutoSearchComponent from '../../components/AutoSearchComponent/AutoSearchComponent';

/**
 * View representing the simple query page and the entry point into querying the database.
 */
class QueryView extends Component {
  constructor(props) {
    super(props);

    const initName = props.location.state
      && props.location.state.mainParams.name
      ? props.location.state.mainParams.name
      : '';

    this.state = {
      name: initName,
      redirect: false,
      endpoint: 'table',
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  /**
   * Sets redirect flag to true if there is a valid query (any string).
   */
  handleSubmit(endpoint) {
    const { name } = this.state;
    if (name) this.setState({ redirect: true, endpoint });
  }

  /**
   * Updates state from user input.
   * @param {Event} e - user input event.
   */
  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  render() {
    const { redirect, endpoint, name } = this.state;

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
            />
          </div>
          <div className="search-buttons">
            <IconButton
              variant="raised"
              color="primary"
              onClick={() => {
                this.handleSubmit('table');
              }}
            >
              <ViewListIcon />
            </IconButton>

            <IconButton
              variant="raised"
              color="secondary"
              onClick={() => {
                this.handleSubmit('graph');
              }}
            >
              <TimelineIcon />
            </IconButton>
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
