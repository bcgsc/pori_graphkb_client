import './index.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import FilterIcon from '@mui/icons-material/FilterList';
import { FormControl, FormHelperText } from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';

import DropDownSelect from '@/components/DropDownSelect';
import RecordAutocomplete from '@/components/RecordAutocomplete';
import api from '@/services/api';

interface FilteredRecordAutocompleteProps extends Pick<React.ComponentProps<typeof RecordAutocomplete>, 'disabled' | 'isMulti' | 'helperText' | 'label' | 'className' | 'onChange' | 'required' | 'value'> {
  /** the base class for creating the class filter for the paired autocomplete component */
  linkedClassName: string;
  /** the field name used in passing to parent handlers */
  name: string;
  /** the initial class selection for the class filter */
  defaultFilterClassName?: string;
  error?: boolean;
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
  filterOptions,
  error = false,
  name,
  label,
  onChange,
  className,
  required,
  value,
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
    <FormControl className="filtered-record-autocomplete" disabled={disabled} error={error}>
      <div className="filtered-record-autocomplete__content">
        {!disabled && (
          <DropDownSelect
            className="node-form__class-select filtered-record-autocomplete__select-search-class"
            IconComponent={FilterIcon}
            label={`Filter (${name}) Search by Class`}
            name="search-class"
            onChange={handleClassChange}
            options={filterOptions || [...schemaDefn.descendants(model.name, { excludeAbstract: false, includeSelf: true })]}
            value={selectedClassName}
          />
        )}
        <RecordAutocomplete
          className={className}
          disabled={disabled}
          getQueryBody={getQueryBody}
          isMulti={isMulti}
          label={label}
          name={name}
          onChange={onChange}
          placeholder={isMulti
            ? `Search for Existing ${selectedClassName} Record(s)`
            : `Search for an Existing ${selectedClassName} Record`}
          required={required}
          value={value}
        />
      </div>
      {helperText && (<FormHelperText>{helperText}</FormHelperText>)}
    </FormControl>
  );
};

export default FilteredRecordAutocomplete;
