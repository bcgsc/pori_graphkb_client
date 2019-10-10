import React, { useState } from 'react';
import PropTypes from 'prop-types';

import './index.scss';
import SearchInput from './SearchInput';
import SearchMenu from './SearchMenu';
import { SEARCH_OPTS } from './util';

const MIN_VAL_LENGTH = 3;

/**
 * Base Component that display popular search options.
 */
function BasePopularSearch(props) {
  const { variant } = props;
  const [searchIndex, setSearchIndex] = useState(0);
  const [value, setValue] = useState(null);
  const [optionalValue, setOptionalValue] = useState('optional');

  const handleSelectionChange = (index) => {
    setSearchIndex(index);
    setValue('');
    setOptionalValue('');
  };

  // handle submission of form
  const handleSubmit = () => {};

  const labels = SEARCH_OPTS[variant].map(opt => opt.label);
  const selectedOption = SEARCH_OPTS[variant][searchIndex];

  return (
    <div className="popular-search__contents">
      <div className="popular-search__menu">
        <SearchMenu
          labels={labels}
          value={searchIndex}
          handleChange={handleSelectionChange}
        />
      </div>
      <div className="popular-search__input-field">
        <SearchInput
          disabled={!value || value.length < MIN_VAL_LENGTH}
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
  variant: PropTypes.string.isRequired,
};

export default BasePopularSearch;
