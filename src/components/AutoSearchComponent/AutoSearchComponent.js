import React, { Component } from "react";
import "./AutoSearchComponent.css";
import Downshift from "downshift";
import {
  MenuItem,
  List,
  Paper,
  TextField,
  Typography
} from "@material-ui/core";
import { Redirect } from "react-router-dom";
import api from "../../services/api";
import * as jc from "json-cycle";
import * as _ from "lodash";

class AutoSearchComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      options: [],
      limit: props.limit || 30,
      endpoint: props.endpoint || "diseases",
      property: props.property || "name",
      isOpen: false,
      loginRedirect: false,
      flag: true
    };

    this.callApi = _.debounce(this.callApi.bind(this), 300);
    this.refreshOptions = this.refreshOptions.bind(this);
  }

  componentWillUnmount() {
    this.callApi.cancel();
    this.render = null;
  }

  refreshOptions(e) {
    this.callApi(e.target.value);
  }

  callApi(value) {
    api
      .get(
        "/" +
          this.state.endpoint +
          "?" +
          this.state.property +
          "=~" +
          value +
          "&limit=" +
          this.state.limit +
          "&neighbors=1"
      )
      .then(response => {
        response = jc.retrocycle(response.result);
        const options = response;
        this.setState({ isOpen: true, options });
      })
      .catch(error => console.error(error));
  }

  render() {
    let options = (inputValue, getItemProps, setState, getInputProps) => {
      return this.state.options.map(
        (item, index) =>
          this.props.children ? (
            this.props.children(
              item,
              getItemProps,
              setState,
              index,
              getInputProps
            )
          ) : (
            <MenuItem
              {...getItemProps({
                key: item["@rid"],
                index,
                item
              })}
              style={{ whiteSpace: "normal", height: "unset" }}
            >
              <span>
                {item.name}
                <Typography color="textSecondary" variant="body1">
                  {item.source && item.source.name ? item.source.name : ""}
                </Typography>
              </span>
            </MenuItem>
          )
      );
    };

    return (
      <Downshift
        onChange={e => {
          this.props.onChange({
            target: { value: e.name, "@rid": e["@rid"], name: this.props.name } //TODO: sourceID variant
          });
        }}
        itemToString={item => {
          if (item) return item.name;
        }}
      >
        {({
          getInputProps,
          getItemProps,
          getLabelProps,
          isOpen,
          inputValue,
          highlightedIndex,
          selectedItem,
          setState
        }) => (
          <div className="autosearch-wrapper">
            <TextField
              fullWidth
              InputProps={{
                ...getInputProps({
                  placeholder: this.props.placeholder,
                  value: this.props.value,
                  onChange: this.props.onChange,
                  name: this.props.name,
                  label: this.props.label,
                  onKeyUp: this.refreshOptions,
                  required: this.props.required
                })
              }}
            />
            {isOpen &&
            options(inputValue, getItemProps, setState, getInputProps)
              .length !== 0 ? (
              <Paper className="droptions">
                <List>
                  {options(inputValue, getItemProps, setState, getInputProps)}
                </List>
              </Paper>
            ) : null}
          </div>
        )}
      </Downshift>
    );
  }
}
export default AutoSearchComponent;
