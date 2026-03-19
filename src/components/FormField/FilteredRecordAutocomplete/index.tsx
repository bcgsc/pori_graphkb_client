import './index.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import FilterIcon from '@mui/icons-material/FilterList';
import { FormControl, FormHelperText } from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';

import DropDownSelect from '@/components/DropDownSelect';
import RecordAutocomplete from '@/components/RecordAutocomplete';
import api from '@/services/api';

import { BaseFormFieldProps } from '../types';

interface FilteredRecordAutocompleteProps extends BaseFormFieldProps {
  /** the base class for creating the class filter for the paired autocomplete component */
  linkedClassName: string;
  /** the initial class selection for the class filter */
  defaultFilterClassName?: string;
  /** allows multiple selections for the autocomplete */
  isMulti?: boolean;
  filterOptions?: string[];
}

/**
 * Allows an autocomplete record link to be filtered based on some class
 * model name to search by
 */
const FilteredRecordAutocomplete = ({
  linkedClassName,
  defaultFilterClassName = '',
  disabled = false,
  isMulti = false,
  helperText = '',
  errorText,
  filterOptions,
  error = false,
  name,
  required,
  readOnly,
  ...rest
}: FilteredRecordAutocompleteProps) => {
  const [selectedClassName, setSelectedClassName] = useState(
    defaultFilterClassName || linkedClassName,
  );

  const handleClassChange = useCallback((event) => {
    const { target: { value } } = event;
    setSelectedClassName(value);
  }, [setSelectedClassName]);

  const model = schemaDefn.get(linkedClassName);

  const getQueryBody = useMemo(() => api.getDefaultSuggestionQueryBody(
    schemaDefn.get(selectedClassName),
  ), [selectedClassName]);

  return (
    <FormControl className="filtered-record-autocomplete" disabled={disabled} error={error} required={required}>
      <div className="filtered-record-autocomplete__content">
        {!(disabled || readOnly) && (
          <DropDownSelect
            className="node-form__class-select filtered-record-autocomplete__select-search-class"
            IconComponent={FilterIcon}
            label={`Filter (${name}) Search by Class`}
            name="search-class"
            onChange={handleClassChange}
            options={filterOptions || [...schemaDefn.descendants(model.name, { excludeAbstract: false, includeSelf: true })]}
            required={required}
            value={selectedClassName}
          />
        )}
        <RecordAutocomplete
          {...rest}
          disabled={disabled && !readOnly}
          error={error}
          getQueryBody={getQueryBody}
          isMulti={isMulti}
          name={name}
          placeholder={isMulti
            ? `Search for Existing ${selectedClassName} Record(s)`
            : `Search for an Existing ${selectedClassName} Record`}
          readOnly={readOnly}
          required={required}
        />
      </div>
      {(errorText || helperText) && (<FormHelperText>{errorText || helperText}</FormHelperText>)}
    </FormControl>
  );
};

export default FilteredRecordAutocomplete;
