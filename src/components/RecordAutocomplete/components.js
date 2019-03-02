/**
 * Adapted from: https://material-ui.com/demos/autocomplete/#react-select
 */
import React from 'react';
import {
  Typography,
  TextField,
  MenuItem,
  Paper,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';


import DetailChip from '../DetailChip';

/* eslint-disable react/prop-types */


const NoOptionsMessage = (props) => {
  const { innerProps, children } = props;
  return (
    <Typography
      color="textSecondary"
      className="record-autocomplete__no-options-message"
      {...innerProps}
    >
      {children}
    </Typography>
  );
};


const inputComponent = ({ inputRef, ...props }) => <div ref={inputRef} {...props} />;


const Control = (props) => {
  const {
    selectProps: { textFieldProps: { InputProps, ...textFieldProps } },
    innerRef,
    innerProps,
    children,
  } = props;
  return (
    <TextField
      fullWidth
      InputProps={{
        inputComponent,
        inputProps: {
          className: 'record-autocomplete__input',
          inputRef: innerRef,
          children,
          ...innerProps,
        },
        ...InputProps,
      }}
      {...textFieldProps}
    />
  );
};


const Option = (props) => {
  const {
    innerProps, children, innerRef, isFocused, isSelected,
  } = props;
  return (
    <MenuItem
      className={`record-autocomplete__option ${isSelected
        ? 'record-autocomplete__option--selected'
        : ''
      }`}
      buttonRef={innerRef}
      selected={isFocused}
      component="div"
      {...innerProps}
    >
      {children}
    </MenuItem>
  );
};


const Placeholder = (props) => {
  const { innerProps, children } = props;
  return (
    <Typography
      color="textSecondary"
      className="record-autocomplete__placeholder"
      {...innerProps}
    >
      {children}
    </Typography>
  );
};


const SingleValue = (props) => {
  const {
    children,
    clearValue,
    data,
    innerProps,
    selectProps: { DetailChipProps, isClearable },
  } = props;
  return (
    <DetailChip
      className="record-autocomplete__chip record-autocomplete__chip--single"
      label={children}
      details={data}
      onDelete={isClearable
        ? clearValue
        : null
      }
      {...DetailChipProps}
      {...innerProps}
    />
  );
};


const MultiValue = (props) => {
  const {
    children,
    data,
    innerProps,
    removeProps: { onClick },
    selectProps: { DetailChipProps, isClearable },
  } = props;
  return (
    <DetailChip
      className="record-autocomplete__chip record-autocomplete__chip--multi"
      label={children}
      details={data}
      onDelete={isClearable
        ? onClick
        : null
      }
      {...DetailChipProps}
      {...innerProps}
    />
  );
};


const ValueContainer = (props) => {
  const { children } = props;
  return <div className="record-autocomplete__value-container">{children}</div>;
};


const Menu = (props) => {
  const { children, innerProps, selectProps: { isSearchable } } = props;

  return (isSearchable
    && (
    <Paper square className="record-autocomplete__paper" {...innerProps}>
      {children}
    </Paper>
    )
  );
};


const DropdownIndicator = (props) => {
  const { className = '' } = props;
  return (
    <SearchIcon
      className={`record-autocomplete__dropdown ${className}`}
    />
  );
};

export {
  Control,
  DropdownIndicator,
  inputComponent,
  Menu,
  MultiValue,
  NoOptionsMessage,
  Option,
  Placeholder,
  SingleValue,
  ValueContainer,
};

export default {
  Control,
  DropdownIndicator,
  inputComponent,
  Menu,
  MultiValue,
  NoOptionsMessage,
  Option,
  Placeholder,
  SingleValue,
  ValueContainer,
};
