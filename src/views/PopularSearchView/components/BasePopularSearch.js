import './index.scss';

import PropTypes from 'prop-types';
import React, { useState } from 'react';

import api from '@/services/api';

import SearchInput from './SearchInput';
import SearchMenu from './SearchMenu';
import SEARCH_OPTS from './util';


const MIN_VAL_LENGTH = 3;

/**
 * Base Component that displays popular search options.
 * @property {string} props.variant one of ['GENE', 'DISEASE', 'DRUG', 'VARIANT']
 * @property {function} props.onError parent error handler
 * @property {function} props.onSubmit parent error handler
 */
function BasePopularSearch(props) {
  const { variant, onError, onSubmit } = props;
  const [searchIndex, setSearchIndex] = useState(0);
  const [value, setValue] = useState('');
  const [optionalValue, setOptionalValue] = useState('');

  const handleSelectionChange = (index) => {
    setSearchIndex(index);
  };


  const labels = SEARCH_OPTS[variant].map(opt => opt.label);
  const selectedOption = SEARCH_OPTS[variant][searchIndex];
  const hasAdditionalField = !!selectedOption.additionalInput;


  /**
   * checks input fields and returns a bool to indicate whether
   * search button should be disabled. If true, search button
   * should be disabled.
   */
  const inputCheck = () => {
    const hasTwoRequiredFields = selectedOption.additionalInput
      ? !selectedOption.additionalInput.optional
      : false;
    const requiredValCheck = (!value || value.length < MIN_VAL_LENGTH);
    const additionalValCheck = (hasTwoRequiredFields && (!optionalValue || optionalValue.length < MIN_VAL_LENGTH));
    return (requiredValCheck || additionalValCheck);
  };

  const isDisabled = inputCheck();

  const handleSubmit = async () => {
    // build search by fetching rids for subqueries to complete full search
    try {
      if (selectedOption.buildSearch) {
        await selectedOption.buildSearch(value, optionalValue);
      }
      const { search: rawSearch, searchChipProps } = selectedOption;

      const search = api.encodeQueryComplexToSearch(rawSearch, 'Statement', searchChipProps);
      onSubmit(search);
    } catch (err) {
      onError(err);
    }
  };

  return (
    <div className="popular-search__contents">
      <div className="popular-search__menu">
        <SearchMenu
          handleChange={handleSelectionChange}
          labels={labels}
          value={searchIndex}
        />
      </div>
      <div className={`popular-search__input-field${hasAdditionalField ? '--optional' : ''}`}>
        <SearchInput
          disabled={isDisabled}
          handleInputChange={setValue}
          handleOptionalChange={setOptionalValue}
          handleSubmit={handleSubmit}
          optionalValue={optionalValue}
          selectedOption={selectedOption}
          value={value}
        />
      </div>
    </div>
  );
}

BasePopularSearch.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  variant: PropTypes.string.isRequired,
  onError: PropTypes.func,
};

BasePopularSearch.defaultProps = {
  onError: () => {},
};

export default BasePopularSearch;
