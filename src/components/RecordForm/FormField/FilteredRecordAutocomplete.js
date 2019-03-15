import React from 'react';
import PropTypes from 'prop-types';
import {
  ListItem,
} from '@material-ui/core';
import { boundMethod } from 'autobind-decorator';

import api from '../../../services/api';
import RecordAutocomplete from '../../RecordAutocomplete';
import FieldHelp from './FieldHelp';
import FormField from '.';
import { KBContext } from '../../KBContext';

import './index.scss';

/**
 * Allows an autocomplete record link to be filtered based on some class
 * model name to search by
 */
class FilteredRecordAutocomplete extends React.PureComponent {
  static contextType = KBContext;

  static propTypes = {
    description: PropTypes.string,
    disabled: PropTypes.bool,
    example: PropTypes.string,
    isPutativeEdge: PropTypes.bool,
    label: PropTypes.string,
    linkedClassName: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    onValueChange: PropTypes.func.isRequired,
    value: PropTypes.any,
  };

  static defaultProps = {
    description: '',
    disabled: false,
    example: '',
    isPutativeEdge: false,
    label: null,
    value: null,
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
      description,
      disabled,
      example,
      isPutativeEdge,
      label,
      linkedClassName,
      name,
      onValueChange,
      value,
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
        return record['@rid'];
      }
      if (Array.isArray(record)) {
        return `Array(${record.length})`;
      }
      return `${record}`;
    };

    return (
      <ListItem component="li" className="form-field form-field--filtered-record-autocomplete">
        {!disabled && (
          <FormField
            model={{
              choices: model.descendantTree(false).map(m => m.name),
              name: 'search class',
            }}
            value={selectedClassName}
            onValueChange={this.handleClassChange}
            schema={schema}
            className="node-form__class-select form-field--filtered-record-autocomplete__select-search-class"
          />
        )}
        <div className="form-field__content">
          <RecordAutocomplete
            DetailChipProps={{
              valueToString,
              getDetails: details => isPutativeEdge
                ? details.target
                : details,
            }}
            disabled={disabled}
            isMulti
            getOptionLabel={itemToString}
            getOptionKey={opt => isPutativeEdge
              ? opt.target['@rid']
              : opt['@rid']
            }
            label={label || name}
            name={name}
            onChange={onValueChange}
            required
            searchHandler={searchHandler}
            value={value}
            placeholder={`Search for an Existing ${selectedClassName} Record`}
          />
        </div>
        <FieldHelp
          className="form-field__help"
          description={description}
          example={example && example.toString()}
        />
      </ListItem>
    );
  }
}


export default FilteredRecordAutocomplete;
