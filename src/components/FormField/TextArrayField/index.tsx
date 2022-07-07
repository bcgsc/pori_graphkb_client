import './index.scss';

import {
  Chip,
  IconButton,
  TextField,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import CancelIcon from '@material-ui/icons/Cancel';
import RefreshIcon from '@material-ui/icons/Refresh';
import { boundMethod } from 'autobind-decorator';
import React, { Component } from 'react';

interface TextArrayFieldProps {
  /** Input name attribute. */
  name: string;
  /** Parent component change handler. */
  onChange: (arg: { target: { name: string; value: string[] } }) => unknown;
  /** Disabled flag. */
  disabled?: boolean;
  /** TextField error flag or message. */
  error?: boolean;
  /** TextField label. */
  label?: string;
  /** Embedded set property as array. */
  value?: string[];
}

interface TextArrayFieldState {
  /** the current list of values (including deleted) */
  value: string[];
  /** the set of items that must be pseudo-deleted */
  initialValue: Set<string>;
  /** the set of items which have been pseudo-deleted */
  deleted: Set<string>;
  /** the current value of the text field */
  textInputValue: string;
  /** the error message for input to the text field */
  textInputError: string;
}

/**
 * Field which stores a list of non-redundant strings from user typed input.
 * Allows the user to clear options if they were entered and not passed in from
 * the parent form. Options that were passed in from the parent form are instead
 * staged for deletion
 */
class TextArrayField extends Component<TextArrayFieldProps, TextArrayFieldState> {
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
      onChange,
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
        onChange({ target: { name, value: value.filter((v) => !deleted.has(v)) } });
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
  @boundMethod
  handleDelete(text) {
    const {
      deleted,
      initialValue,
      value,
    } = this.state;
    const {
      name,
      onChange,
    } = this.props;

    if (text) {
      if (initialValue.has(text)) {
        deleted.add(text);
        this.setState({ deleted });
      } else {
        this.setState({ value: value.filter((v) => v !== text) });
      }
      onChange({ target: { name, value: value.filter((v) => !deleted.has(v)) } });
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
      onChange,
    } = this.props;
    const { deleted, value } = this.state;

    deleted.delete(text);
    this.setState({ deleted });
    onChange({ target: { name, value: value.filter((v) => !deleted.has(v)) } });
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
      const removeValue = value.filter((v) => !deleted.has(v)).pop();

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
          const isDeleted = deleted.has(text);
          const props = {
            deleteIcon: isDeleted
              ? <RefreshIcon />
              : <CancelIcon />,
            onDelete: isDeleted
              ? () => this.handleRestore(text)
              : () => this.handleDelete(text),
            className: `text-array-field__chip${isDeleted
              ? ' text-array-field__chip--deleted'
              : ''
            }`,
          };
          return (
            <Chip
              key={text}
              label={text}
              {...props}
            />
          );
        },
      );

    return (
      <div className="text-array-field">
        <TextField
          className="text-array-field__text-field"
          disabled={disabled}
          error={Boolean(textInputError || error)}
          helperText={textInputError}
          id={`${label.toLowerCase()}-temp`}
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
          label={label}
          name={label.toLowerCase()}
          onChange={this.handleInputChange}
          onKeyDown={this.handleInputKeyPress}
          value={textInputValue}
        />
        <div className="text-array-field__btns">
          <IconButton
            aria-label="add"
            color="primary"
            disabled={disabled}
            onClick={this.handleAddCurrent}
          >
            <AddIcon />
          </IconButton>
        </div>
      </div>
    );
  }
}

export default TextArrayField;
