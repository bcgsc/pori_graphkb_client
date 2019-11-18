import React from 'react';
import PropTypes from 'prop-types';
import { boundMethod } from 'autobind-decorator';
import { FormControl, FormHelperText } from '@material-ui/core';

import api from '@/services/api';
import RecordAutocomplete from '../../RecordAutocomplete';
import ResourceSelectComponent from '../../ResourceSelectComponent';
import schema from '@/services/schema';

import './index.scss';

/**
 * Allows an autocomplete record link to be filtered based on some class
 * model name to search by
 */
class FilteredRecordAutocomplete extends React.PureComponent {
  static propTypes = {
    disabled: PropTypes.bool,
    isMulti: PropTypes.bool,
    linkedClassName: PropTypes.string.isRequired,
    DetailChipProps: PropTypes.object,
    helperText: PropTypes.string,
    error: PropTypes.bool,
    name: PropTypes.string.isRequired,
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
      <FormControl className="filtered-record-autocomplete" error={error} disabled={disabled}>
        <div className="filtered-record-autocomplete__content">
          {!disabled && (
          <ResourceSelectComponent
            name="search-class"
            onChange={this.handleClassChange}
            resources={[...model.descendantTree(false).map(m => m.name)]}
            label={`Filter (${name}) Search by Class`}
            value={selectedClassName}
            className="node-form__class-select filtered-record-autocomplete__select-search-class"
          />
          )}
          <RecordAutocomplete
            {...rest}
            isMulti={isMulti}
            DetailChipProps={{
              ...DetailChipProps,
              valueToString,
              getDetails: details => details,
            }}
            name={name}
            disabled={disabled}
            getOptionLabel={itemToString}
            getOptionKey={opt => opt['@rid']}
            searchHandler={searchHandler}
            placeholder={isMulti
              ? `Search for Existing ${selectedClassName} Record(s)`
              : `Search for an Existing ${selectedClassName} Record`
            }
          />
        </div>
        {helperText && (<FormHelperText>{helperText}</FormHelperText>)}
      </FormControl>
    );
  }
}


export default FilteredRecordAutocomplete;
