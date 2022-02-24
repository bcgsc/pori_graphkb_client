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
  onChange?: (searchText: string) => void;
  /** the handler when the seach icon is pressed or enter is hit */
  onSubmit?: (searchText: string) => void;
  /** the initial value in the serach box */
  value?: string;
}

function SearchBox({
  onSubmit = () => {},
  value = '',
  error,
  helperText,
  onChange = () => {},
  className,
  ...props
}: SearchBoxProps) {
  const [searchText, setSearchText] = useState(value);
  const [debouncedSearchText] = useDebounce(searchText, 300);
  const ENTER_KEYCODE = 13;

  const handleTextChange = useCallback(({ target: { value: newValue } }) => {
    setSearchText(newValue);
  }, []);

  useEffect(() => {
    onChange(debouncedSearchText);
  }, [debouncedSearchText, onChange]);

  return (
    <div
      className={`search-box ${className}`}
      onKeyUp={(event) => event.keyCode === ENTER_KEYCODE && onSubmit(searchText)}
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
            <InputAdornment>
              <IconButton color="primary" data-testid="search-box__button" onClick={() => onSubmit(searchText)}>
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
}

SearchBox.defaultProps = {
  onChange: () => {},
  onSubmit: () => {},
  value: '',
  error: false,
  helperText: '',
  className: '',
};

export default SearchBox;
