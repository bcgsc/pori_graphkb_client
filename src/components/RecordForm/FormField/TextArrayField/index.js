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

import './index.scss';


/**
 * Field which stores a list of non-redundant strings from user typed input.
 * Allows the user to clear options if they were entered and not passed in from
 * the parent form. Options that were passed in from the parent form are instead
 * staged for deletion
 *
 * @property {object} props
 * @property {function} props.onValueChange - Parent component change handler.
 * @property {Array.<string>} props.value - Embedded set property as array.
 * @property {string} props.label - TextField label.
 * @property {string} props.name - Input name attribute.
 * @property {boolean|string} props.error - TextField error flag or message.
 * @property {boolean} props.disabled - Disabled flag.
 * @property {object} state
 * @property {Array.<string>} state.value the current list of values (including deleted)
 * @property {Set} state.deleted the set of items which have been pseudo-deleted
 * @property {Set} state.initialValue the set of items that must be pseudo-deleted
 * @property {string} state.textInputError the error message for input to the text field
 * @property {string} state.textInputValue the current value of the text field
 */
class TextArrayField extends Component {
  static propTypes = {
    disabled: PropTypes.bool,
    error: PropTypes.bool,
    label: PropTypes.string,
    name: PropTypes.string.isRequired,
    onValueChange: PropTypes.func.isRequired,
    value: PropTypes.arrayOf(PropTypes.string),
  };

  static defaultProps = {
    disabled: false,
    error: false,
    label: '',
    value: [],
  };

  constructor(props) {
    super(props);
    const { value } = props;
    this.state = {
      value: (value || []).slice(),
      initialValue: new Set((value || []).slice()), // items in this list should be pseudo-deleted and allow restore
      deleted: new Set(), // items that have been marked as deleted
      textInputValue: '',
      textInputError: '',
    };
  }

  /**
   * Adds new element to state list. Clears textfield input.
   * @param {string} text - element to add
   */
  handleAdd(text) {
    const {
      name,
      onValueChange,
    } = this.props;

    const { value, deleted } = this.state;

    if (text) {
      if (value.includes(text)) {
        if (deleted.has(text)) {
          deleted.delete(text);
          this.setState({ deleted, textInputValue: '', textInputError: '' });
        } else {
          this.setState({ textInputError: `Cannot add '${text}'. Elements must be unique` });
        }
      } else {
        value.push(text);
        this.setState({ value, textInputValue: '', textInputError: '' });
        onValueChange({ target: { name, value: value.filter(v => !deleted.has(v)) } });
      }
    }
  }

  /**
   * Trigger an add of the current value of the text input field
   */
  @boundMethod
  handleAddCurrent() {
    const { textInputValue: text } = this.state;
    this.handleAdd(text);
  }

  /**
   * Deletes element from state list.
   * @param {string} text - element to be deleted.
   */
  handleDelete(text) {
    const {
      deleted,
      initialValue,
      value,
    } = this.state;
    const {
      name,
      onValueChange,
    } = this.props;

    if (text) {
      if (initialValue.has(text)) {
        deleted.add(text);
        this.setState({ deleted });
      } else {
        this.setState({ value: value.filter(v => v !== text) });
      }
      onValueChange({ target: { name, value: value.filter(v => !deleted.has(v)) } });
    }
  }

  /**
   * Reverts a element that is staged for deletion.
   * @param {string} text - deleted element to be restored.
   */
  @boundMethod
  handleRestore(text) {
    const {
      name,
      onValueChange,
    } = this.props;
    const { deleted, value } = this.state;

    deleted.delete(text);
    this.setState({ deleted });
    onValueChange({ target: { name, value: value.filter(v => !deleted.has(v)) } });
  }

  /**
   * Handles user changes to component state.
   * @param {Event} event - User change event.
   */
  @boundMethod
  handleInputChange(event) {
    const { target: { value: text } } = event;
    const { value } = this.state;
    this.setState({ textInputValue: text });
    if (text) {
      if (value.includes(text)) {
        this.setState({ textInputError: `Cannot add '${text}'. Elements must be unique` });
        return;
      }
    }
    this.setState({ textInputError: '' });
  }

  /**
   * Handles the user hitting enter to insert a new
   * term or backspace to remove the one
   */
  @boundMethod
  handleInputKeyPress(event) {
    const { key, target: { value: text } } = event;
    const { value, deleted } = this.state;

    if (text) {
      if (key === 'Enter') {
        this.handleAdd(text);
      }
    } else if (key === 'Backspace') {
      const removeValue = value.filter(v => !deleted.has(v)).pop();
      if (removeValue) {
        this.handleDelete(removeValue);
      }
    }
  }

  render() {
    const {
      deleted,
      value,
      textInputValue,
      textInputError,
    } = this.state;
    const {
      label,
      disabled,
      error,
    } = this.props;

    const chips = value
      .map(
        (text) => {
          if (!deleted.has(text)) {
            return (
              <Chip
                label={text}
                deleteIcon={<CancelIcon />}
                onDelete={() => this.handleDelete(text)}
                key={text}
                className="text-array-field__chip"
              />
            );
          }
          return (
            <Chip
              label={text}
              deleteIcon={<RefreshIcon />}
              onDelete={() => this.handleRestore(text)}
              key={text}
              className="text-array-field__chip--deleted"
            />
          );
        },
      );

    return (
      <div className="text-array-field">
        <TextField
          className="text-array-field__text-field"
          id={`${label.toLowerCase()}-temp`}
          label={label}
          name={label.toLowerCase()}
          value={textInputValue}
          onChange={this.handleInputChange}
          disabled={disabled}
          error={Boolean(textInputError || error)}
          onKeyDown={this.handleInputKeyPress}
          helperText={textInputError}
          InputProps={{
            classes: {
              root: 'text-array-field__field',
            },
            inputProps: {
              className: 'text-array-field__input',
            },
            startAdornment: chips.length > 0
              ? chips
              : undefined,
          }}
        />
        <div className="text-array-field__btns">
          <IconButton
            color="primary"
            onClick={this.handleAddCurrent}
            disabled={disabled}
          >
            <AddIcon />
          </IconButton>
        </div>
      </div>
    );
  }
}

export default TextArrayField;
