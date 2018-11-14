/**
 * @module /components/AutoSearchBase
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './AutoSearchBase.css';
import {
  MenuItem,
  List,
  Paper,
  TextField,
  CircularProgress,
  InputAdornment,
  Popper,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import Downshift from 'downshift';
import RecordChip from '../RecordChip/RecordChip';

const PROGRESS_SPINNER_SIZE = 20;

/**
 * Base component for all autosearch components.
 */
class AutoSearchBase extends Component {
  constructor(props) {
    super(props);
    this.setRef = (node) => {
      this.popperNode = node;
    };
  }

  render() {
    const {
      children,
      value,
      selected,
      loading,
      itemToString,
      options,
      onSelect,
      onChange,
      onClear,
      endAdornment,
      TextFieldProps,
      DownshiftProps,
      disablePortal,
    } = this.props;

    const autoSearchResults = downshiftProps => options
      .map((item, index) => children(item, index, downshiftProps));

    const {
      error,
      disabled,
      InputProps,
      ...otherTextFieldProps
    } = TextFieldProps;

    const { onBlur, onFocus } = InputProps || {};
    return (
      <Downshift
        {...DownshiftProps}
        onChange={onSelect}
        itemToString={itemToString}
      >
        {(downshiftProps) => {
          const {
            getInputProps,
            isOpen,
            getMenuProps,
          } = downshiftProps;
          const empty = options.length === 0 && isOpen && !loading;
          return (
            <div className="autosearch-wrapper">
              <div className="autosearch-popper-node" ref={this.setRef}>
                <TextField
                  {...otherTextFieldProps}
                  fullWidth
                  error={empty || error}
                  disabled={disabled || !!selected}
                  helperText={empty && 'No Results'}
                  style={{ minWidth: selected && 0 }}
                  InputProps={{
                    ...InputProps,
                    ...getInputProps({
                      onChange,
                      onBlur,
                      onFocus,
                      value: selected ? ' ' : value,
                    }),
                    disableUnderline: !!selected,
                    endAdornment: endAdornment ? (
                      <InputAdornment
                        position="end"
                      >
                        {endAdornment}
                      </InputAdornment>
                    ) : null,
                    startAdornment: selected
                      ? (
                        <RecordChip
                          onDelete={() => onClear ? onClear() : null}
                          record={selected}
                        />
                      ) : null,
                  }}
                />
              </div>
              <Popper
                open
                anchorEl={this.popperNode}
                placement="bottom-start"
                disablePortal={disablePortal}
                style={{ zIndex: 1600 }}
              >
                {(isOpen || loading) && !empty && (
                  <div {...getMenuProps()}>
                    <Paper
                      className="droptions"
                      style={{
                        width: this.popperNode && this.popperNode.clientWidth,
                      }}
                    >
                      <List>
                        {loading
                          ? (
                            <CircularProgress
                              color="primary"
                              size={PROGRESS_SPINNER_SIZE}
                              id="autosearch-spinner"
                            />
                          )
                          : autoSearchResults(downshiftProps)}
                      </List>
                    </Paper>
                  </div>)}
              </Popper>
            </div>);
        }}
      </Downshift>
    );
  }
}

/**
 * @namespace
 * @property {string} value - specified value for two way binding.
 * @property {function} onChange - parent method for handling change events
 * @property {number} limit - database return record limit.
 * @property {string} endpoint - api endpoint identifier.
 * @property {string} property - api property identifier.
 * @property {string} placeholder - placeholder for text input.
 * @property {string} label - label for text input.
 * @property {bool} required - required flag for text input indicator.
 * @property {bool} error - error flag for text input.
 * @property {function} children - Function that yields the component for
 * display display query results.
 * @property {bool} disabled - disabled flag for text input.
 * @property {Object} endAdornment - component to adorn the end of input text
 * field with.
 * @property {Record} selected - Last selected record.
 */
AutoSearchBase.propTypes = {
  children: PropTypes.func,
  value: PropTypes.string,
  selected: PropTypes.object,
  loading: PropTypes.bool,
  itemToString: PropTypes.func,
  options: PropTypes.array,
  endAdornment: PropTypes.object,
  onSelect: PropTypes.func,
  onChange: PropTypes.func,
  onClear: PropTypes.func,
  TextFieldProps: PropTypes.object,
  DownshiftProps: PropTypes.object,
  disablePortal: PropTypes.bool,
};

AutoSearchBase.defaultProps = {
  children: (item, index, downshiftProps) => (
    <MenuItem
      {...downshiftProps.getItemProps({
        key: item,
        index,
        item,
      })}
      selected={downshiftProps.highlightedIndex === index}
    >
      <span>
        {item}
      </span>
    </MenuItem>
  ),
  value: undefined,
  selected: undefined,
  loading: false,
  itemToString: item => item,
  options: [],
  endAdornment: <SearchIcon />,
  onSelect: undefined,
  onChange: undefined,
  onClear: undefined,
  TextFieldProps: {},
  DownshiftProps: {},
  disablePortal: false,
};

export default AutoSearchBase;
