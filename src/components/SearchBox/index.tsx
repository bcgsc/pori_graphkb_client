import {
  IconButton,
  InputAdornment,
  TextField,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import React, { useCallback, useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

interface SearchBoxProps {
  /** the class name to add to the parent div element */
  className?: string;
  /** the error state of the input box */
  error?: boolean;
  /** the text to display below the search box */
  helperText?: string;
  /** handler triggered when the input changes (debounced) */
  onChange: (...args: unknown[]) => unknown;
  /** the handler when the seach icon is pressed or enter is hit */
  onSubmit?: (...args: unknown[]) => unknown;
  /** the initial value in the serach box */
  value?: string;
  /** Rest of props for TextField */
  [key: string]: unknown;
}

const SearchBox = ({
  onSubmit = () => {},
  value = '',
  error = false,
  helperText,
  onChange = () => {},
  className = '',
  ...props
}: SearchBoxProps) => {
  const [searchText, setSearchText] = useState(value);
  const [debouncedSearchText] = useDebounce(searchText, 300);
  const ENTER_KEYCODE = 13;

  const handleTextChange = useCallback(({ target: { value: newValue } }) => {
    setSearchText(newValue);
  }, []);

  useEffect(() => {
    onChange(debouncedSearchText);
  }, [debouncedSearchText, onChange]);

  const handleSubmit = useCallback((text) => {
    if (onSubmit) { onSubmit(text); }
  }, [onSubmit]);

  return (
    <div
      className={`search-box ${className}`}
      onKeyUp={(event) => event.keyCode === ENTER_KEYCODE && handleSubmit(searchText)}
      role="textbox"
      tabIndex={0}
    >
      <TextField
        fullWidth
        {...props}
        error={error}
        helperText={helperText}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton color="primary" data-testid="search-box__button" onClick={() => handleSubmit(searchText)}>
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        inputProps={{ // eslint-disable-line react/jsx-no-duplicate-props
          'data-testid': 'search-box__input',
        }}
        onChange={handleTextChange}
        value={searchText}
      />
    </div>
  );
};

export default SearchBox;
