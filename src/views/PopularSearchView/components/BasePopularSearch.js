import React, { useState } from 'react';
import PropTypes from 'prop-types';

import './index.scss';
import SearchInput from './SearchInput';
import SearchMenu from './SearchMenu';

const SEARCH_OPTS = {
  DRUG: [
    {
      label: 'Given a drug, find all variants associated with therapeutic sensitivity',
      requiredInput: { label: 'Drug', property: 'name', class: 'Therapy' },
    },
    {
      label: 'Given a drug, find all varaints associated with resistance',
      requiredInput: { label: 'Drug', property: 'name', class: 'Therapy' },
    },
    {
      label: 'Given a drug, find all variants with pharmacogenomic information',
      requiredInput: { label: 'Drug', property: 'name', class: 'Therapy' },
    },
    {
      label: 'Given a drug, find all disease it is approved for use',
      requiredInput: { label: 'Drug', property: 'name', class: 'Therapy' },
    },
  ],
  DISEASE: [
    {
      label: 'Given a disease, find all genes associaed with therapeutic sensitivity',
      requiredInput: { label: 'Disease', property: 'name', class: 'Disease' },
    },
    {
      label: 'Given a disease, find all genes associated with therapeutic resistance',
      requiredInput: { label: 'Disease', property: 'name', class: 'Disease' },
    },
    {
      label: 'Given a disease, find all variants associated with a relevance',
      requiredInput: { label: 'Disease', property: 'name', class: 'Disease' },
    },
  ],
  VARIANT: [
    {
      label: 'Given a variant, find all therapies associaed with sensitivity for Disease(s)',
      requiredInput: { label: 'Variant', property: 'name', class: 'Variant' },
      optionalInput: { label: 'Disease', property: 'name', class: 'Disease' },
    },
    {
      label: 'Given a variant, find all therapies associated with resistance',
      requiredInput: { label: 'Variant', property: 'name', class: 'Variant' },
      optionalInput: { label: 'Disease', property: 'name', class: 'Disease' },
    },
    {
      label: 'Given a variant, find all disease that the variant is associated with',
      requiredInput: { label: 'Variant', property: 'name', class: 'Variant' },
      optionalInput: { label: 'Relevance', property: 'name', class: 'Vocabulary' },
    },
  ],
  GENE: [
    {
      label: 'Given a gene, find all variants reported for all diseases',
      requiredInput: { label: 'Gene', property: 'name', class: 'Feature' },
    },
    {
      label: 'Given a gene, find a specific disease and the associated relevances',
      requiredInput: { label: 'Gene', property: 'name', class: 'Feature' },
    },
    {
      label: 'Given a gene, find all variants linked with drug sensitivity or resistance',
      requiredInput: { label: 'Gene', property: 'name', class: 'Feature' },
    },
    {
      label: 'Given a gene, find all variants on the ',
      requiredInput: { label: 'Gene', property: 'name', class: 'Feature' },
    },
  ],
};
const MIN_VAL_LENGTH = 3;

/**
 * Base Component that displays popular search options.
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
        />
      </div>
    </div>
  );
}

BasePopularSearch.propTypes = {
  variant: PropTypes.string.isRequired,
};

export default BasePopularSearch;
