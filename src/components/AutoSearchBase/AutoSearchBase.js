/**
 * @module /components/AutoSearchBase
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './AutoSearchBase.scss';
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
 * Base component for all autosearch components. Uses Downshift and Material-UI
 * TextField components.
 * @property {object} props
 * @property {Object} props.schema - Knowledgebase schema object.
 * @property {string} props.value - specified value for two way binding.
 * @property {function} props.onChange - Handler for user typing event.
 * @property {function} props.onSelect - Handler for selection of a displayed option.
 * @property {function} props.onClear - Handler for clearing of selected value.
 * @property {Object} props.selected - Last selected record object.
 * @property {function} props.children - Function that yields the component for
 * display display query results.
 * @property {boolean} props.loading - Flag to display loading progress indicator.
 * @property {function} props.itemToString - Cast function to be applied to options.
 * @property {Array<any>} props.options - list of items to be displayed as options
 * when results panel is open.
 * @property {Object} props.endAdornment - Component to adorn the end of input text
 * field with.
 * @property {Object} props.TextFieldProps - Props to be passed on to the TextField
 * component.
 * @property {Object} props.DownShiftProps - Props to be passed on to the Downshift
 * component.
 * @property {boolean} props.disablePortal - Flag to disable the Portal in the Popper
 * component (renders "inside" parent node).
 * @property {string} props.className - className to be passed on to root div
 * component.
 */
class AutoSearchBase extends Component {
  constructor(props) {
    super(props);
    this.setRef = (node) => {
      this.popperNode = node;
    };
  }

  static get propTypes() {
    return {
      schema: PropTypes.object,
      value: PropTypes.string,
      onChange: PropTypes.func,
      onSelect: PropTypes.func,
      onClear: PropTypes.func,
      selected: PropTypes.object,
      children: PropTypes.func,
      loading: PropTypes.bool,
      itemToString: PropTypes.func,
      options: PropTypes.arrayOf(PropTypes.any),
      endAdornment: PropTypes.node,
      TextFieldProps: PropTypes.object,
      DownshiftProps: PropTypes.object,
      disablePortal: PropTypes.bool,
      className: PropTypes.string,
    };
  }

  static get defaultProps() {
    return {
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
      schema: null,
      className: '',
    };
  }

  render() {
    const {
      className,
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
      schema,
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
            <div className={`${className} autosearch-wrapper`}>
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
                          schema={schema}
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
                  </div>
                )}
              </Popper>
            </div>
          );
        }}
      </Downshift>
    );
  }
}


export default AutoSearchBase;
