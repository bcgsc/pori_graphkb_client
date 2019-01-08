import { boundMethod } from 'autobind-decorator';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  Chip,
  IconButton,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import AddIcon from '@material-ui/icons/Add';
import RefreshIcon from '@material-ui/icons/Refresh';

import './EmbeddedSetForm.scss';


/**
 * Generated component for 'embeddedset' property types.
 * @property {object} props
 * @property {function} props.onChange - Parent component change handler.
 * @property {Array.<string>} props.list - Embedded set property as array.
 * @property {string} props.label - TextField label.
 * @property {string} props.name - Input name attribute.
 * @property {boolean} props.error - TextField error flag.
 * @property {boolean} props.disabled - Disabled flag.
 */
class EmbeddedSetForm extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    list: PropTypes.arrayOf(PropTypes.string),
    label: PropTypes.string,
    name: PropTypes.string,
    error: PropTypes.bool,
    disabled: PropTypes.bool,
  };

  static defaultProps = {
    list: [],
    label: '',
    name: '',
    error: false,
    disabled: false,
  };

  constructor(props) {
    super(props);
    this.state = {
      deleted: [],
      tempElement: '',
      initList: props.list.slice(),
    };
  }

  /**
   * Adds new element to state list. Clears temporary element field.
   * @param {Event} event - User element add event (button click or Enter keypress)
   */
  @boundMethod
  handleAdd(event) {
    event.preventDefault();
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
  @boundMethod
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
  @boundMethod
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
   * @param {Event} event - User change event.
   */
  @boundMethod
  handleChange(event) {
    this.setState({ tempElement: event.target.value });
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
          name={label.toLowerCase()}
          value={tempElement}
          onChange={this.handleChange}
          disabled={disabled}
          error={error}
          onKeyDown={(event) => {
            if (event.keyCode === 13) {
              this.handleAdd(event);
            }
            if (event.keyCode === 8 && !tempElement) {
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

export default EmbeddedSetForm;
