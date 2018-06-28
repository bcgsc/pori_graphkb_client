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
import { debounce } from "throttle-debounce";
import * as jc from "json-cycle";

class AutoSearchComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      options: [],
      limit: props.limit || 30,
      endpoint: props.endpoint || "diseases",
      property: props.property || "name",
      isOpen: false,
      loginRedirect: false
    };
    this.callApi = debounce(300, this.callApi.bind(this));
    this.refreshOptions = this.refreshOptions.bind(this);
  }

  componentWillUnmount() {
    this.callApi = null;
    this.refreshOptions = null;
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
        console.log(response);
        response = jc.retrocycle(response.result);
        console.log(response);
        const options = response.map(object => {
          return object;
        });
        this.setState({ isOpen: true, options });
      })
      .catch(error => console.log(error));
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
            target: { value: e.name, "@rid": e["@rid"], name: this.props.name }
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
              onChange={this.props.onChange}
              onKeyUp={this.refreshOptions}
              fullWidth
              required={this.props.required}
              label={this.props.label}
              InputProps={{
                ...getInputProps({
                  placeholder: this.props.placeholder,
                  value: this.props.value,
                  onChange: this.props.onChange,
                  name: this.props.name
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
