import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
  Typography, FormControl,
} from '@material-ui/core';
import './index.scss';
import ActionButton from '../../../components/ActionButton';
import { KBContext } from '../../../components/KBContext';
import RecordAutocomplete from '../../../components/RecordAutocomplete';
import api from '../../../services/api';

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
    selectedOption: { requiredInput, optionalInput },
  } = props;

  const hasOptionalInput = !!optionalInput;

  const { schema } = useContext(KBContext);

  const searchHandler = api.defaultSuggestionHandler(
    schema.get(requiredInput.class),
  );

  let optSearchHandler;

  if (hasOptionalInput) {
    optSearchHandler = api.defaultSuggestionHandler(
      schema.get(optionalInput.class),
    );
  }

  const handleChange = (event, optionalValue = false) => {
    const { target: { value: newVal } } = event;

    if (optionalValue) {
      handleOptionalChange(newVal);
    } else {
      handleInputChange(newVal);
    }
  };

  return (
    <div className="search-input">
      <div className="search-input__label">
        <Typography variant="h3">
          {requiredInput.label}
        </Typography>
      </div>
      <div className="search-input__input-field">
        <FormControl className="" variant="outlined">
          <RecordAutocomplete
            getOptionLabel={item => schema.getLabel(item)}
            getOptionKey={opt => opt['@rid']}
            searchHandler={searchHandler}
            placeholder={`Search for a ${requiredInput.label}`}
            onChange={e => handleChange(e)}
            className="input-box"
          />
        </FormControl>
      </div>
      {(hasOptionalInput) && (
      <>
        <div className="search-input__label">
          <Typography variant="h3">
            {optionalInput.label}
          </Typography>
        </div>
        <div className="search-input__input-field">
          <FormControl className="" variant="outlined">
            <RecordAutocomplete
              getOptionLabel={item => schema.getLabel(item)}
              getOptionKey={opt => opt['@rid']}
              searchHandler={optSearchHandler}
              placeholder="Optional - defaults to all if left empty"
              onChange={e => handleChange(e)}
              className="input-box"
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
    optionalInput: PropTypes.object,
  }),
};

SearchInput.defaultProps = {
  disabled: false,
  handleInputChange: () => {},
  handleSubmit: () => {},
  handleOptionalChange: () => {},
  selectedOption: {},
};

export default SearchInput;
