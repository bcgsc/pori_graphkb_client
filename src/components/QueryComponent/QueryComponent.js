import React, { Component } from "react";
import "./QueryComponent.css";
import Button from "@material-ui/core/Button";
import { Link, Redirect } from "react-router-dom";
import AutoSearchComponent from "../AutoSearchComponent/AutoSearchComponent";

class QueryComponent extends Component {
  constructor(props) {
    super(props);

    let initName;
    if (props.location.state) {
      initName = props.location.state.name;
    }

    this.state = {
      name: initName || "",
      redirect: false
    };

    this.handleName = this.handleName.bind(this);
    this.submit = this.submit.bind(this);
  }

  submit() {
    if (this.state.name) this.setState({ redirect: true });
  }

  handleName(e) {
    this.setState({ name: e.target.value });
  }

  render() {
    if (this.state.redirect)
      return (
        <Redirect
          push
          to={{ pathname: "/results", search: "?name=~" + this.state.name }}
        />
      );

    return (
      <div>
        <div
          className="search-wrapper"
          onKeyUp={e => {
            if (e.keyCode === 13) {
              this.submit();
            }
          }}
        >
          <div className="search-bar">
            <div className="main-search">
              <AutoSearchComponent
                value={this.state.name}
                onChange={e => {
                  this.handleName(e);
                }}
                placeholder="Search"
                limit={30}
              />
            </div>
            <Button
              variant="raised"
              color="primary"
              onClick={() => {
                this.submit();
              }}
            >
              Search
            </Button>
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

export default QueryComponent;
