import React from 'react';
import PropTypes from 'prop-types';
import { boundMethod } from 'autobind-decorator';

import api from '../../../services/api';
import RecordAutocomplete from '../../RecordAutocomplete';
import ResourceSelectComponent from '../../ResourceSelectComponent';
import { KBContext } from '../../KBContext';

import './index.scss';

/**
 * Allows an autocomplete record link to be filtered based on some class
 * model name to search by
 */
class FilteredRecordAutocomplete extends React.PureComponent {
  static contextType = KBContext;

  static propTypes = {
    disabled: PropTypes.bool,
    isPutativeEdge: PropTypes.bool,
    linkedClassName: PropTypes.string.isRequired,
  };

  static defaultProps = {
    disabled: false,
    isPutativeEdge: false,
  };

  constructor(props) {
    super(props);
    const { linkedClassName } = this.props;
    this.state = {
      selectedClassName: linkedClassName,
    };
  }

  @boundMethod
  handleClassChange(event) {
    const { target: { value } } = event;
    this.setState({ selectedClassName: value });
  }

  render() {
    const { schema } = this.context;
    const {
      disabled,
      isPutativeEdge,
      linkedClassName,
      ...rest
    } = this.props;
    const {
      selectedClassName,
    } = this.state;

    const model = schema.get(linkedClassName);

    const itemToString = (item) => {
      if (isPutativeEdge) {
        if (item && item.target) {
          return schema.getLabel(item.target);
        }
      } else {
        return schema.getLabel(item);
      }
      return `${item}`;
    };

    const searchHandler = api.defaultSuggestionHandler(
      schema.get(selectedClassName), { isPutativeEdge },
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
      <div className="filtered-record-autocomplete">
        {!disabled && (
          <ResourceSelectComponent
            name="search-class"
            onChange={this.handleClassChange}
            resources={[...model.descendantTree(false).map(m => m.name)]}
            label="Filter Search by Class"
            value={selectedClassName}
            className="node-form__class-select filtered-record-autocomplete__select-search-class"
          />
        )}
        <div className="form-field__content">
          <RecordAutocomplete
            {...rest}
            DetailChipProps={{
              valueToString,
              getDetails: details => isPutativeEdge
                ? details.target
                : details,
            }}
            disabled={disabled}
            getOptionLabel={itemToString}
            getOptionKey={opt => isPutativeEdge
              ? opt.target['@rid']
              : opt['@rid']
            }
            searchHandler={searchHandler}
            placeholder={`Search for an Existing ${selectedClassName} Record`}
          />
        </div>
      </div>
    );
  }
}


export default FilteredRecordAutocomplete;
