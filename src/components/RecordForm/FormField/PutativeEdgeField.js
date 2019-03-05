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
 * Form Field used for staged statement relationships which
 * are submitted with the statement for new statment forms
 *
 * Combines a resource select drop down on the left with a
 * record autocomplete. The left hand select allows the user
 * to refine the search function that is used for the record
 * autocomplete
 */
class PutativeEdgeField extends React.Component {
  static contextType = KBContext;

  static propTypes = {
    description: PropTypes.string,
    disabled: PropTypes.bool,
    example: PropTypes.string,
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
      disabled,
      value,
      label,
      name,
      onValueChange,
      description,
      example,
      linkedClassName,
    } = this.props;
    const {
      selectedClassName,
    } = this.state;

    const model = schema.get(linkedClassName);

    const itemToString = (item) => {
      if (item && item.target) {
        try {
          const text = schema.getPreview(item.target);
          if (item.target['@rid']) {
            return `${text} (${item.target['@rid']})`;
          }
          return text;
          } catch (err) {}  // eslint-disable-line
      } else if (item.target) {
        return `${item.target}`;
      }
      return `${item}`;
    };

    return (
      <ListItem component="li" className="form-field form-field--edge">
        {!disabled && (
          <FormField
            model={{
              choices: model.descendantTree(false).map(m => m.name),
              name: 'search class',
            }}
            value={selectedClassName}
            onValueChange={this.handleClassChange}
            schema={schema}
            className="node-form__class-select form-field--edge__select-search-class"
          />
        )}
        <div className="form-field__content">
          <RecordAutocomplete
            DetailChipProps={{
              valueToString: (record) => {
                if (record && record['@rid']) {
                  return record['@rid'];
                }
                if (Array.isArray(record)) {
                  return `Array(${record.length})`;
                }
                return `${record}`;
              },
              getDetails: details => details.target,
            }}
            disabled={disabled}
            isMulti
            getOptionLabel={itemToString}
            getOptionKey={opt => opt.target['@rid']}
            label={label || name}
            name={name}
            onChange={onValueChange}
            required
            searchHandler={api.defaultSuggestionHandler(
              schema.get(selectedClassName), { isPutativeEdge: true },
            )}
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


export default PutativeEdgeField;
