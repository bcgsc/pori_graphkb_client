import React, { useState } from 'react';
import PropTypes from 'prop-types';

import './index.scss';
import SearchInput from './SearchInput';
import SearchMenu from './SearchMenu';
import api from '../../../services/api';
import { SEARCH_OPTS } from './util';


const MIN_VAL_LENGTH = 3;

/**
 * Base Component that displays popular search options.
 */
function BasePopularSearch(props) {
  const { variant, history } = props;
  const [searchIndex, setSearchIndex] = useState(0);
  const [value, setValue] = useState('');
  const [optionalValue, setOptionalValue] = useState('');

  const handleSelectionChange = (index) => {
    setSearchIndex(index);
  };


  const labels = SEARCH_OPTS[variant].map(opt => opt.label);
  const selectedOption = SEARCH_OPTS[variant][searchIndex];
  const hasOptionalField = !!selectedOption.optionalInput;

  // handle submission of form
  const handleSubmit = async () => {
    if (value.length < MIN_VAL_LENGTH) {
      // snackbar disapproving message
      return;
    }

    // build search by fetching rids for subqueries to complete full search
    if (selectedOption.buildSearch) {
      await selectedOption.buildSearch(value, optionalValue);
    }
    const { search: rawSearch } = selectedOption;

    const search = api.encodeQueryComplexToSearch(rawSearch, 'Statement');
    history.push(`/data/table?${search}`, { search });
  };

  return (
    <div className="popular-search__contents">
      <div className="popular-search__menu">
        <SearchMenu
          labels={labels}
          value={searchIndex}
          handleChange={handleSelectionChange}
        />
      </div>
      <div className={`popular-search__input-field${hasOptionalField ? '--optional' : ''}`}>
        <SearchInput
          disabled={!value || value.length < MIN_VAL_LENGTH}
          handleInputChange={setValue}
          handleOptionalChange={setOptionalValue}
          handleSubmit={handleSubmit}
          value={value}
          optionalValue={optionalValue}
          selectedOption={selectedOption}
        />
      </div>
    </div>
  );
}

BasePopularSearch.propTypes = {
  variant: PropTypes.string.isRequired,
  history: PropTypes.object.isRequired,
};

export default BasePopularSearch;
