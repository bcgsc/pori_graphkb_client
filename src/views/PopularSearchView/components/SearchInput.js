import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
} from '@material-ui/core';
import './index.scss';
import ActionButton from '../../../components/ActionButton';


/**
 * handles required/optional input for Popular Search View.
 *
 * @property {bool} props.disabled disabled input flag from parent
 * @property {function} props.handleInputChange parent input change handler
 * @property {function} props.handleOptionalChange handler for optional input
 * @property {string} props.value value of required input
 * @property {function} props.handleSubmit parent search handler
 * @property {object} props.selectedOption search option and it's required/optional inputs
 */
function SearchInput(props) {
  const {
    disabled,
    handleInputChange,
    handleOptionalChange,
    handleSubmit,
    optionalValue,
    selectedOption: { requiredInput, additionalInput },
    selectedOption,
    value,
  } = props;


  const hasAdditionalInput = !!additionalInput;

  const handleChange = (event, optionalVal = false) => {
    const { target: { value: newVal } } = event;

    if (optionalVal) {
      handleOptionalChange(newVal);
    } else {
      handleInputChange(newVal);
    }
  };

  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
    handleOptionalChange('');
    handleInputChange('');
  }, [handleInputChange, handleOptionalChange, selectedOption]);

  return (
    <div className="search-input">
      <div className="search-input__input-field">
        <TextField
          autoFocus
          className="input-box"
          helperText={requiredInput.example}
          inputProps={{ 'data-testid': 'search-input' }}
          inputRef={ref}
          label={requiredInput.label}
          margin="normal"
          onChange={e => handleChange(e)}
          required
          variant="outlined"
          value={value}
        />
      </div>
      {(hasAdditionalInput) && (
        <div className="search-input__input-field">
          <TextField
            className="input-box"
            helperText={additionalInput.example}
            inputProps={{ 'data-testid': 'additional-input' }}
            label={additionalInput.label}
            margin="normal"
            onChange={e => handleChange(e, true)}
            required={!additionalInput.optional}
            variant="outlined"
            value={optionalValue}
          />
        </div>
      )}
      <div className="search-input__action-button">
        <ActionButton
          variant="contained"
          color="primary"
          size="large"
          requireConfirm={false}
          disabled={disabled}
          onClick={handleSubmit}
        >
              Search
        </ActionButton>
      </div>

    </div>
  );
}

SearchInput.propTypes = {
  disabled: PropTypes.bool,
  handleInputChange: PropTypes.func,
  handleSubmit: PropTypes.func,
  handleOptionalChange: PropTypes.func,
  selectedOption: PropTypes.shape({
    label: PropTypes.string,
    requiredInput: PropTypes.object,
    additionalInput: PropTypes.object,
  }),
  optionalValue: PropTypes.string,
  value: PropTypes.string.isRequired,
};

SearchInput.defaultProps = {
  disabled: false,
  handleInputChange: () => {},
  handleSubmit: () => {},
  handleOptionalChange: () => {},
  selectedOption: {},
  optionalValue: '',
};

export default SearchInput;
