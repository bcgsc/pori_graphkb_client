/**
 * Adapted from: https://material-ui.com/demos/autocomplete/#react-select
 */
import {
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import React from 'react';

import DetailChip from '../DetailChip';

/* eslint-disable react/prop-types */


const NoOptionsMessage = (props) => {
  const { innerProps, children } = props;
  return (
    <Typography
      className="record-autocomplete__no-options-message"
      color="textSecondary"
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
      buttonRef={innerRef}
      className={`record-autocomplete__option ${isSelected
        ? 'record-autocomplete__option--selected'
        : ''
      }`}
      component="div"
      selected={isFocused}
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
      className="record-autocomplete__placeholder"
      color="textSecondary"
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
      details={data}
      label={children}
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
      details={data}
      label={children}
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
    <Paper className="record-autocomplete__paper" elevation={2} square {...innerProps}>
      {children}
    </Paper>
    )
  );
};


const DropdownIndicator = (props) => {
  const { className = '', selectProps: { isSearchable } } = props;
  return (
    !isSearchable ? null
      : (
        <SearchIcon
          className={`record-autocomplete__dropdown ${className}`}
        />
      )
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
