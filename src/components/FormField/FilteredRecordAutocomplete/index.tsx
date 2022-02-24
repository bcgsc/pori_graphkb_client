import './index.scss';

import { FormControl, FormHelperText } from '@material-ui/core';
import FilterIcon from '@material-ui/icons/FilterList';
import React, { useCallback, useMemo, useState } from 'react';

import DropDownSelect from '@/components/DropDownSelect';
import RecordAutocomplete from '@/components/RecordAutocomplete';
import api from '@/services/api';
import schema from '@/services/schema';

interface FilteredRecordAutocompleteProps {
  /** the base class for creating the class filter for the paired autocomplete component */
  linkedClassName: string;
  /** the field name used in passing to parent handlers */
  name: string;
  /** the initial class selection for the class filter */
  defaultFilterClassName?: string;
  disabled?: boolean;
  error?: boolean;
  filterOptions?: string[];
  helperText?: string;
  /** allows multiple selections for the autocomplete */
  isMulti?: boolean;
}

/**
 * Allows an autocomplete record link to be filtered based on some class
 * model name to search by
 *
 * @note all remaining properties are passed to the RecordAutocomplete component
 */
function FilteredRecordAutocomplete(props: FilteredRecordAutocompleteProps) {
  const {
    linkedClassName,
    defaultFilterClassName,
    disabled,
    isMulti,
    helperText,
    filterOptions,
    error,
    name,
    ...rest
  } = props;
  const [selectedClassName, setSelectedClassName] = useState(
    defaultFilterClassName || linkedClassName,
  );

  const handleClassChange = useCallback((event) => {
    const { target: { value } } = event;
    setSelectedClassName(value);
  }, [setSelectedClassName]);

  const model = schema.get(linkedClassName);

  const getQueryBody = useMemo(() => api.getDefaultSuggestionQueryBody(
    schema.get(selectedClassName),
  ), [selectedClassName]);

  return (
    <FormControl className="filtered-record-autocomplete" disabled={disabled} error={error}>
      <div className="filtered-record-autocomplete__content">
        {!disabled && (
          <DropDownSelect
            className="node-form__class-select filtered-record-autocomplete__select-search-class"
            IconComponent={FilterIcon}
            label={`Filter (${name}) Search by Class`}
            name="search-class"
            onChange={handleClassChange}
            options={filterOptions || [...model.descendantTree(false).map((m) => m.name)]}
            value={selectedClassName}
          />
        )}
        <RecordAutocomplete
          {...rest}
          disabled={disabled}
          getQueryBody={getQueryBody}
          isMulti={isMulti}
          name={name}
          placeholder={isMulti
            ? `Search for Existing ${selectedClassName} Record(s)`
            : `Search for an Existing ${selectedClassName} Record`}
        />
      </div>
      {helperText && (<FormHelperText>{helperText}</FormHelperText>)}
    </FormControl>
  );
}

FilteredRecordAutocomplete.defaultProps = {
  disabled: false,
  defaultFilterClassName: '',
  filterOptions: null,
  isMulti: false,
  helperText: '',
  error: false,
};

export default FilteredRecordAutocomplete;
