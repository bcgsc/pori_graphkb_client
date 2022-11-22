import './index.scss';

import {
  Chip,
  IconButton,
  TextField,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import CancelIcon from '@material-ui/icons/Cancel';
import RefreshIcon from '@material-ui/icons/Refresh';
import uniq from 'lodash.uniq';
import without from 'lodash.without';
import React, { useState } from 'react';

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

/**
 * Field which stores a list of non-redundant strings from user typed input.
 * Allows the user to clear options if they were entered and not passed in from
 * the parent form. Options that were passed in from the parent form are instead
 * staged for deletion
 */
const TextArrayField = (props: TextArrayFieldProps) => {
  const {
    value: valueProp, name, onChange, label = '', disabled, error,
  } = props;
  /** the current list of values (including deleted) */
  const [value, setValue] = useState((valueProp || []).slice());
  // items in this list should be pseudo-deleted and allow restore
  const [initialValue] = useState(uniq(valueProp || []));
  /** the set of items which have been pseudo-deleted */
  const [deleted, setDeleted] = useState<string[]>([]);
  /** the current value of the text field */
  const [textInputValue, setTextInputValue] = useState('');
  /** the error message for input to the text field */
  const [textInputError, setTextInputError] = useState('');

  /**
   * Adds new element to state list. Clears textfield input.
   * @param {string} text - element to add
   */
  const handleAdd = (text: string) => {
    if (text) {
      if (value.includes(text)) {
        if (deleted.includes(text)) {
          setDeleted(without(deleted, text));
          setTextInputValue('');
          setTextInputError('');
        } else {
          setTextInputError(`Cannot add '${text}'. Elements must be unique`);
        }
      } else {
        const nextValue = [...value, text];
        setValue(nextValue);
        setTextInputValue('');
        setTextInputError('');
        onChange({ target: { name, value: nextValue.filter((v) => !deleted.includes(v)) } });
      }
    }
  };

  /**
   * Trigger an add of the current value of the text input field
   */
  const handleAddCurrent = () => {
    handleAdd(textInputValue);
  };

  /**
   * Deletes element from state list.
   * @param {string} text - element to be deleted.
   */
  const handleDelete = (text: string) => {
    if (text) {
      let nextValue = value;
      let nextDeleted = deleted;

      if (initialValue.includes(text)) {
        nextDeleted = uniq([...deleted, text]);
        setDeleted(nextDeleted);
      } else {
        nextValue = without(value, text);
        setValue(nextValue);
      }
      onChange({ target: { name, value: nextValue.filter((v) => !nextDeleted.includes(v)) } });
    }
  };

  /**
   * Reverts a element that is staged for deletion.
   * @param {string} text - deleted element to be restored.
   */
  const handleRestore = (text: string) => {
    const nextDeleted = without(deleted, text);
    setDeleted(nextDeleted);
    onChange({ target: { name, value: value.filter((v) => !nextDeleted.includes(v)) } });
  };

  /**
   * Handles user changes to component state.
   * @param {Event} event - User change event.
   */
  const handleInputChange = (event) => {
    const { target: { value: text } } = event;
    setTextInputValue(text);

    if (text) {
      if (value.includes(text)) {
        setTextInputError(`Cannot add '${text}'. Elements must be unique`);
        return;
      }
    }

    setTextInputError('');
  };

  /**
   * Handles the user hitting enter to insert a new
   * term or backspace to remove the one
   */
  const handleInputKeyPress = (event) => {
    const { key, target: { value: text } } = event;

    if (text) {
      if (key === 'Enter') {
        handleAdd(text);
      }
    } else if (key === 'Backspace') {
      const removeValue = value.filter((v) => !deleted.includes(v)).pop();

      if (removeValue) {
        handleDelete(removeValue);
      }
    }
  };

  const chips = value
    .map(
      (text) => {
        const isDeleted = deleted.includes(text);
        const props = {
          deleteIcon: isDeleted
            ? <RefreshIcon />
            : <CancelIcon />,
          onDelete: isDeleted
            ? () => handleRestore(text)
            : () => handleDelete(text),
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
        onChange={handleInputChange}
        onKeyDown={handleInputKeyPress}
        value={textInputValue}
      />
      <div className="text-array-field__btns">
        <IconButton
          aria-label="add"
          color="primary"
          disabled={disabled}
          onClick={handleAddCurrent}
        >
          <AddIcon />
        </IconButton>
      </div>
    </div>
  );
};

TextArrayField.defaultProps = {
  disabled: false,
  error: false,
  label: '',
  value: [],
};

export default TextArrayField;
