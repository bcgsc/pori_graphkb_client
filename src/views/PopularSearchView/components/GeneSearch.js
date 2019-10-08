import React, { useState } from 'react';

import './index.scss';
import SearchInput from './SearchInput';
import SearchMenu from './SearchMenu';
import { SEARCH_OPTS } from './util';

const MIN_VAL_LENGTH = 3;

function GeneSearch() {
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

  const labels = SEARCH_OPTS.GENE.map(opt => opt.label);
  const selectedOption = SEARCH_OPTS.GENE[searchIndex];

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
          selectedOption={selectedOption}
          value={value}
          optionalValue={optionalValue}
          handleInputChange={setValue}
          handleOptionalChange={setOptionalValue}
          disabled={!value || value.length < MIN_VAL_LENGTH}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

export default GeneSearch;
