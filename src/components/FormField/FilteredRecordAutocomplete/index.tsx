import './index.scss';

import FilterIcon from '@mui/icons-material/FilterList';
import {
  InputAdornment, MenuItem, Select, Tooltip,
} from '@mui/material';
import React, {
  ReactNode, useCallback, useMemo, useState,
} from 'react';

import RecordAutocomplete from '@/components/RecordAutocomplete';
import api from '@/services/api';
import schemaDefn from '@/services/schema';

const FilterIconWithTooltip = React.forwardRef<SVGSVGElement, React.ComponentProps<typeof FilterIcon>>((props: React.ComponentProps<typeof FilterIcon>, ref) => (
  <Tooltip
    arrow
    placement="top"
    title="Filter records search by selected Class"
  >
    {/* eslint-disable-next-line react/jsx-props-no-spreading */}
    <FilterIcon {...props} ref={ref} />
  </Tooltip>
));

interface FilteredRecordAutocompleteProps extends Pick<React.ComponentProps<typeof RecordAutocomplete>, 'disabled' | 'isMulti' | 'helperText' | 'label' | 'className' | 'onChange' | 'required' | 'value' | 'readOnly'> {
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
  filterOptions: filterOptionsProp,
  error = false,
  name,
  label,
  onChange,
  className,
  required,
  value,
  readOnly,
}: FilteredRecordAutocompleteProps) => {
  const [selectedClassName, setSelectedClassName] = useState(
    defaultFilterClassName || linkedClassName,
  );

  const filterOptions = useMemo(() => {
    if (filterOptionsProp) {
      return filterOptionsProp;
    }
    const model = schemaDefn.get(linkedClassName);
    return schemaDefn.descendants(model.name, { excludeAbstract: false, includeSelf: true });
  }, [filterOptionsProp, linkedClassName]);

  const handleClassChange = useCallback((event) => {
    if (readOnly) return;
    const { target: { value } } = event;
    setSelectedClassName(value);
  }, [setSelectedClassName, readOnly]);

  const getQueryBody = useMemo(() => api.getDefaultSuggestionQueryBody(
    schemaDefn.get(selectedClassName),
  ), [selectedClassName]);

  let startAdornment: ReactNode;

  if (!readOnly) {
    startAdornment = (
      <InputAdornment position="start">
        <Select
          aria-label={`Filter (${name}) Search by Class`}
          className="filtered-record-autocomplete__class-filter"
          disableUnderline
          IconComponent={FilterIconWithTooltip}
          name="search-class"
          onChange={handleClassChange}
          value={selectedClassName}
          variant="standard"
        >
          {filterOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </InputAdornment>
    );
  }

  return (
    <RecordAutocomplete
      className={`filtered-record-autocomplete ${className || ''}`}
      disabled={disabled}
      error={error}
      getQueryBody={getQueryBody}
      helperText={helperText}
      isMulti={isMulti}
      label={label}
      name={name}
      onChange={onChange}
      placeholder={isMulti
        ? `Search for Existing ${selectedClassName} Record(s)`
        : `Search for an Existing ${selectedClassName} Record`}
      readOnly={readOnly}
      required={required}
      startAdornment={startAdornment}
      value={value}
    />
  );
};

export default FilteredRecordAutocomplete;
