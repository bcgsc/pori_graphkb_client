import './index.scss';

import { FormControl, FormHelperText } from '@material-ui/core';
import FilterIcon from '@material-ui/icons/FilterList';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';

import RecordAutocomplete from '@/components/RecordAutocomplete';
import ResourceSelectComponent from '@/components/ResourceSelectComponent';
import api from '@/services/api';
import schema from '@/services/schema';

/**
 * Allows an autocomplete record link to be filtered based on some class
 * model name to search by
 */
const FilteredRecordAutocomplete = ({
  linkedClassName,
  disabled,
  isMulti,
  DetailChipProps,
  helperText,
  error,
  name,
  ...rest
}) => {
  const [selectedClassName, setSelectedClassName] = useState(linkedClassName);

  const handleClassChange = useCallback((event) => {
    const { target: { value } } = event;
    setSelectedClassName(value);
  }, [setSelectedClassName]);


  const model = schema.get(linkedClassName);

  const itemToString = item => schema.getLabel(item);

  const searchHandler = api.defaultSuggestionHandler(
    schema.get(selectedClassName),
  );

  const valueToString = (record) => {
    if (record && record['@rid']) {
      return schema.getLabel(record, false);
    }
    if (Array.isArray(record)) {
      return `Array(${record.length})`;
    }
    return `${record}`;
  };

  return (
    <FormControl className="filtered-record-autocomplete" disabled={disabled} error={error}>
      <div className="filtered-record-autocomplete__content">
        {!disabled && (
          <ResourceSelectComponent
            className="node-form__class-select filtered-record-autocomplete__select-search-class"
            IconComponent={FilterIcon}
            label={`Filter (${name}) Search by Class`}
            name="search-class"
            onChange={handleClassChange}
            resources={[...model.descendantTree(false).map(m => m.name)]}
            value={selectedClassName}
          />
        )}
        <RecordAutocomplete
          {...rest}
          DetailChipProps={{
            ...DetailChipProps,
            valueToString,
            getDetails: details => details,
          }}
          disabled={disabled}
          getOptionKey={opt => opt['@rid']}
          getOptionLabel={itemToString}
          isMulti={isMulti}
          name={name}
          placeholder={isMulti
            ? `Search for Existing ${selectedClassName} Record(s)`
            : `Search for an Existing ${selectedClassName} Record`
            }
          searchHandler={searchHandler}
        />
      </div>
      {helperText && (<FormHelperText>{helperText}</FormHelperText>)}
    </FormControl>
  );
};

FilteredRecordAutocomplete.propTypes = {
  linkedClassName: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  DetailChipProps: PropTypes.object,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  isMulti: PropTypes.bool,
};

FilteredRecordAutocomplete.defaultProps = {
  disabled: false,
  isMulti: false,
  helperText: '',
  error: false,
  DetailChipProps: {},
};


export default FilteredRecordAutocomplete;
