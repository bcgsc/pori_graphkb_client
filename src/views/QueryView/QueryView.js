import React, { Component } from "react";
import { Link, Redirect } from "react-router-dom";
import "./QueryView.css";
import { Button, IconButton } from "@material-ui/core";
import ViewListIcon from "@material-ui/icons/ViewList";
import TimelineIcon from "@material-ui/icons/Timeline";
import AutoSearchComponent from "../../components/AutoSearchComponent/AutoSearchComponent";

/**
 * View representing the simple query page and the entry point into querying the database.
 */
class QueryView extends Component {
  /**
   * Initializes the query string and binds methods to the component for two
   * way data binding. Initializes redirect flag as false.
   * @param {state?} props continued state object passed from AdvancedQueryView component.
   */
  constructor(props) {
    super(props);

    const initName =
      props.location.state && props.location.state.mainParams.name
        ? props.location.state.mainParams.name
        : "";
    this.state = {
      name: initName,
      redirect: false,
      endpoint: "table"
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  /**
   * Sets redirect flag to true if there is a valid query (any string).
   */
  handleSubmit(endpoint) {
    if (this.state.name) this.setState({ redirect: true, endpoint });
  }

  /**
   * Sets state field specified by event target name to event target value.
   * @param {Event} e
   */
  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  render() {
    //Redirects to
    if (this.state.redirect)
      return (
        <Redirect
          push
          to={{
            pathname: "/data/" + this.state.endpoint,
            search: "?name=~" + this.state.name + "&neighbors=3"
          }}
        />
      );

    return (
      <div>
        <div
          className="search-wrapper"
          onKeyUp={e => {
            if (e.keyCode === 13) {
              this.handleSubmit("table");
            }
          }}
        >
          <div className="search-bar">
            <div className="main-search">
              <AutoSearchComponent
                value={this.state.name}
                onChange={e => {
                  this.handleChange(e);
                }}
                placeholder="Search"
                limit={30}
                name="name"
              />
            </div>
            <div className="search-buttons">
              <IconButton
                variant="raised"
                color="primary"
                onClick={() => {
                  this.handleSubmit("table");
                }}
              >
                <ViewListIcon />
              </IconButton>
              <IconButton
                variant="raised"
                color="secondary"
                onClick={() => {
                  this.handleSubmit("graph");
                }}
              >
                <TimelineIcon />
              </IconButton>
            </div>
          </div>
          <Link
            className="query-link"
            to={{ state: this.state, pathname: "/query/advanced" }}
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
      </div>
    );
  }
}

export default QueryView;
