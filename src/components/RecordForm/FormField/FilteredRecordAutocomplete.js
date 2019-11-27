import './index.scss';

import { FormControl, FormHelperText } from '@material-ui/core';
import { boundMethod } from 'autobind-decorator';
import PropTypes from 'prop-types';
import React from 'react';

import api from '@/services/api';
import schema from '@/services/schema';

import RecordAutocomplete from '../../RecordAutocomplete';
import ResourceSelectComponent from '../../ResourceSelectComponent';

/**
 * Allows an autocomplete record link to be filtered based on some class
 * model name to search by
 */
class FilteredRecordAutocomplete extends React.PureComponent {
  static propTypes = {
    linkedClassName: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    DetailChipProps: PropTypes.object,
    disabled: PropTypes.bool,
    error: PropTypes.bool,
    helperText: PropTypes.string,
    isMulti: PropTypes.bool,
  };

  static defaultProps = {
    disabled: false,
    isMulti: false,
    helperText: '',
    error: false,
    DetailChipProps: {},
  };

  constructor(props) {
    super(props);
    const { linkedClassName } = this.props;
    this.state = {
      selectedClassName: linkedClassName,
    };
  }

  componentDidUpdate(prevProps) {
    const { linkedClassName } = this.props;

    if (linkedClassName !== prevProps.linkedClassName) {
      this.setState({ selectedClassName: linkedClassName });
    }
  }

  @boundMethod
  handleClassChange(event) {
    const { target: { value } } = event;
    this.setState({ selectedClassName: value });
  }

  render() {
    const {
      disabled,
      isMulti,
      linkedClassName,
      DetailChipProps,
      helperText,
      error,
      name,
      ...rest
    } = this.props;

    const {
      selectedClassName,
    } = this.state;

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
            label={`Filter (${name}) Search by Class`}
            name="search-class"
            onChange={this.handleClassChange}
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
  }
}


export default FilteredRecordAutocomplete;
