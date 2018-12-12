import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './EmbeddedSetForm.css';
import {
  TextField,
  Chip,
  IconButton,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import AddIcon from '@material-ui/icons/Add';
import RefreshIcon from '@material-ui/icons/Refresh';

/**
 * Generated component for 'embeddedset' property types.
 */
class EmbeddedSetForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deleted: [],
      tempElement: '',
      initList: props.list.slice(),
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
  }

  /**
   * Adds new element to state list. Clears temporary element field.
   * @param {Event} e - User element add event (button click or Enter keypress)
   */
  handleAdd(e) {
    e.preventDefault();
    const {
      list,
      name,
      onChange,
    } = this.props;

    const {
      tempElement,
    } = this.state;

    if (tempElement.trim() && !list.includes(tempElement.toLowerCase())) {
      list.push(tempElement);
      onChange({ target: { name, value: list } });
      this.setState({ tempElement: ' ' });
    }
  }

  /**
   * Deletes element from state list.
   * @param {string} val - element to be deleted.
   */
  handleDelete(val) {
    const {
      deleted,
      initList,
    } = this.state;
    const {
      list,
      onChange,
      name,
    } = this.props;
    if (list.indexOf(val) !== -1) {
      list.splice(list.indexOf(val), 1);
      onChange({ target: { name, value: list } });
      if (initList && initList.includes(val)) {
        deleted.push(val);
      }
    }
    this.setState({ deleted });
  }

  /**
   * Reverts a element that is staged for deletion.
   * @param {string} val - deleted element to be reverted.
   */
  handleUndo(val) {
    const {
      name,
      onChange,
      list,
    } = this.props;
    const { deleted } = this.state;
    deleted.splice(deleted.indexOf(val), 1);
    list.push(val);
    onChange({ target: { name, value: list } });
    this.setState({ deleted });
  }

  /**
   * Handles user changes to component state.
   * @param {Event} e - User change event.
   */
  handleChange(e) {
    this.setState({ tempElement: e.target.value });
  }

  render() {
    const {
      deleted,
      tempElement,
    } = this.state;
    const {
      list,
      label,
      disabled,
      error,
    } = this.props;

    const embeddedList = list
      .map(s => (
        <Chip
          label={s}
          deleteIcon={<CancelIcon />}
          onDelete={() => this.handleDelete(s)}
          key={s}
          className="embedded-list-chip"
        />
      ));

    embeddedList.push(...deleted.map(s => (
      <Chip
        label={s}
        deleteIcon={<RefreshIcon />}
        onDelete={() => this.handleUndo(s)}
        key={s}
        className="embedded-list-chip deleted-chip"
      />
    )));
    return (
      <div className="embedded-list-wrapper">
        <TextField
          className="embedded-list-textfield"
          id={`${label.toLowerCase()}-temp`}
          label={label}
          value={tempElement}
          onChange={this.handleChange}
          disabled={disabled}
          error={error}
          onKeyDown={(e) => {
            if (e.keyCode === 13) {
              this.handleAdd(e);
            }
            if (e.keyCode === 8 && !tempElement) {
              this.handleDelete(list[list.length - 1]);
            }
          }}
          InputProps={{
            classes: {
              root: 'embedded-list-field',
            },
            inputProps: {
              className: 'embedded-list-input',
            },
            startAdornment: embeddedList.length > 0 ? embeddedList : undefined,
          }}
        />
        <div className="embedded-list-btns">
          <IconButton
            color="primary"
            onClick={this.handleAdd}
            disabled={disabled}
          >
            <AddIcon />
          </IconButton>
        </div>
      </div>
    );
  }
}

/**
 * @namespace
 * @property {function} onChange - Parent component change handler.
 * @property {Array.<string>} list - Embedded set property as array.
 * @property {string} label - TextField label.
 * @property {string} name - Input name attribute.
 * @property {boolean} error - TextField error flag.
 * @property {boolean} disabled - Disabled flag.
 */
EmbeddedSetForm.propTypes = {
  onChange: PropTypes.func.isRequired,
  list: PropTypes.arrayOf(PropTypes.string),
  label: PropTypes.string,
  name: PropTypes.string,
  error: PropTypes.bool,
  disabled: PropTypes.bool,
};

EmbeddedSetForm.defaultProps = {
  list: [],
  label: '',
  name: '',
  error: false,
  disabled: false,
};

export default EmbeddedSetForm;
