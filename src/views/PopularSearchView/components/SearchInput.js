import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Typography, Card, CardContent, FormControl, InputLabel, OutlinedInput,
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
    optionalValue: initialOptVal,
    value: initialValue,
    handleSubmit,
    selectedOption: { requiredInput, optionalInput },
  } = props;

  const labelRef = React.useRef(null);
  const optLabelRef = React.useRef(null);
  const hasOptionalInput = !!optionalInput;

  const [value, setValue] = useState(initialValue);
  const [optValue, setOptValue] = useState(initialOptVal);

  useEffect(() => {
    setValue(initialValue);
    setOptValue(initialOptVal);
  }, [initialOptVal, initialValue]);

  const handleChange = (event, optionalValue = false) => {
    const { target: { value: newVal } } = event;

    if (optionalValue) {
      handleOptionalChange(newVal);
    } else {
      handleInputChange(newVal);
    }
  };

  return (
    <Card>
      <CardContent>
        <div className="search-input__label">
          <Typography variant="h3">
            {requiredInput.class}
          </Typography>
        </div>
        <div className="search-input__input-field">
          <FormControl className="" variant="outlined">
            <InputLabel ref={labelRef} htmlFor="component-outlined">
              {requiredInput.property}
            </InputLabel>
            <OutlinedInput
              id="component-outlined"
              value={value}
              onChange={e => handleChange(e)}
            />
          </FormControl>
        </div>
        {(hasOptionalInput) && (
          <>
            <div className="search-input__label">
              <Typography variant="h3">
                {optionalInput.class}
              </Typography>
            </div>
            <div className="search-input__input-field">
              <FormControl className="" variant="outlined">
                <InputLabel ref={optLabelRef} htmlFor="component-outlined">
                  {optionalInput.property}
                </InputLabel>
                <OutlinedInput
                  id="component-outlined2"
                  value={optValue}
                  onChange={e => handleChange(e, true)}
                />
              </FormControl>
            </div>
          </>
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

      </CardContent>
    </Card>
  );
}

SearchInput.propTypes = {
  disabled: PropTypes.bool,
  handleInputChange: PropTypes.func,
  handleSubmit: PropTypes.func,
  handleOptionalChange: PropTypes.func,
  optionalValue: PropTypes.string,
  selectedOption: PropTypes.object,
  value: PropTypes.string,
};

SearchInput.defaultProps = {
  disabled: false,
  handleInputChange: () => {},
  handleSubmit: () => {},
  handleOptionalChange: () => {},
  optionalValue: '',
  selectedOption: {},
  value: '',
};

export default SearchInput;
