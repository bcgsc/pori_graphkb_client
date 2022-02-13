import {
  IconButton,
  InputAdornment,
  TextField,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';


/**
 * @param {Object} props
 * @param {function} props.onSubmit the handler when the seach icon is pressed or enter is hit
 * @param {function} props.onChange handler triggered when the input changes (debounced)
 * @param {string} props.value the initial value in the serach box
 * @param {string} props.helperText the text to display below the search box
 * @param {string} props.className the class name to add to the parent div element
 * @param {boolean} props.error the error state of the input box
 */
const SearchBox = ({
  onSubmit, value, error, helperText, onChange, className, ...props
}) => {
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
      onKeyUp={event => event.keyCode === ENTER_KEYCODE && onSubmit(searchText)}
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
};


SearchBox.propTypes = {
  className: PropTypes.string,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  value: PropTypes.string,
};


SearchBox.defaultProps = {
  onChange: () => {},
  onSubmit: () => {},
  value: '',
  error: false,
  helperText: '',
  className: '',
};


export default SearchBox;
