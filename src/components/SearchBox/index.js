import {
  IconButton,
  InputAdornment,
  TextField,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';


const SearchBox = ({
  onSubmit, value, error, helperText, onChange, className, debounceMs, ...props
}) => {
  const [searchText, setSearchText] = useState(value);
  const [debouncedSearchText] = useDebounce(searchText, debounceMs);
  const ENTER_KEYCODE = 13;

  const handleTextChange = useCallback(({ target: { value: newValue } }) => {
    setSearchText(newValue);
    onChange(debouncedSearchText);
  }, [debouncedSearchText, onChange]);

  useEffect(() => {
    onChange(debouncedSearchText);
  }, [debouncedSearchText, onChange]);

  return (
    <div
      className={`search-box ${className}`}
      onKeyUp={event => event.keyCode === ENTER_KEYCODE && onSubmit}
      role="textbox"
      tabIndex={0}
    >
      <TextField
        fullWidth
        {...props}
        value={searchText}
        onChange={handleTextChange}
        InputProps={{
          endAdornment: (
            <InputAdornment>
              <IconButton onClick={onSubmit} color="primary">
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        error={error}
        helperText={helperText}
      />
    </div>
  );
};


SearchBox.propTypes = {
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  value: PropTypes.string,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  className: PropTypes.string,
  debounceMs: PropTypes.number,
};


SearchBox.defaultProps = {
  onChange: () => {},
  onSubmit: () => {},
  value: '',
  error: false,
  helperText: '',
  debounceMs: 300,
  className: '',
};


export default SearchBox;
