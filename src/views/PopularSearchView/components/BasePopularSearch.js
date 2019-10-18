import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import './index.scss';
import SearchInput from './SearchInput';
import SearchMenu from './SearchMenu';

const SEARCH_OPTS = {
  DRUG: [
    {
      label: 'Given a drug, find all variants associated with therapeutic sensitivity',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. Adriamycin',
      },
    },
    {
      label: 'Given a drug, find all variants associated with resistance',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. Adriamycin',
      },
    },
    {
      label: 'Given a drug, find all variants with pharmacogenomic information',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. Adriamycin',
      },
    },
    {
      label: 'Given a drug, find all diseases it is approved for use',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. Adriamycin',
      },
    },
  ],
  DISEASE: [
    {
      label: 'Given a disease, find all genes associated with therapeutic sensitivity',
      requiredInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
    },
    {
      label: 'Given a disease, find all genes associated with therapeutic resistance',
      requiredInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
    },
    {
      label: 'Given a disease, find all variants associated with a relevance',
      requiredInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
    },
  ],
  VARIANT: [
    {
      label: 'Given a variant, find all therapies associated with sensitivity for Disease(s)',
      requiredInput: {
        label: 'Variant', property: 'name', class: 'Variant', example: 'Ex. KRAS:p.G12A',
      },
      optionalInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
    },
    {
      label: 'Given a variant, find all therapies associated with resistance',
      requiredInput: {
        label: 'Variant', property: 'name', class: 'Variant', example: 'Ex. KRAS:p.G12A',
      },
      optionalInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
    },
    {
      label: 'Given a variant, find all diseases that the variant is associated with',
      requiredInput: {
        label: 'Variant', property: 'name', class: 'Variant', example: 'Ex. KRAS:p.G12A',
      },
      optionalInput: {
        label: 'Relevance', property: 'name', class: 'Vocabulary', example: 'Ex. Reduced sensitivity',
      },
    },
  ],
  GENE: [
    {
      label: 'Given a gene, find all variants reported for all diseases',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
    },
    {
      label: 'Given a gene, find a specific disease and the associated relevances',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
    },
    {
      label: 'Given a gene, find all variants linked with drug sensitivity or resistance',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
    },
    {
      label: 'Given a gene, find all variants on the gene',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
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
  const [value, setValue] = useState('');
  const [optionalValue, setOptionalValue] = useState('');

  const handleSelectionChange = (index) => {
    setSearchIndex(index);
  };

  // handle submission of form
  const handleSubmit = () => {};

  const labels = SEARCH_OPTS[variant].map(opt => opt.label);
  const selectedOption = SEARCH_OPTS[variant][searchIndex];
  const hasOptionalField = !!selectedOption.optionalInput;

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
          handleInputChange={useCallback(setValue)}
          handleOptionalChange={useCallback(setOptionalValue)}
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
};

export default BasePopularSearch;
