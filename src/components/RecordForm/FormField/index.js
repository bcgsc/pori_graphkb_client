import React from 'react';
import {
  ListItem,
  TextField,
} from '@material-ui/core';
import PropTypes from 'prop-types';

import api from '../../../services/api';
import ResourceSelectComponent from '../../ResourceSelectComponent';
import RecordAutocomplete from '../../RecordAutocomplete';
import { withKB } from '../../KBContext';
import FieldHelp from './FieldHelp';
import BooleanField from './BooleanField';
import TextArrayField from './TextArrayField';
import PermissionsTable from './PermissionsTable';
import FilteredRecordAutocomplete from './FilteredRecordAutocomplete';

// unavoidable circular dependency below
import EmbeddedNodeForm from '../EmbeddedNodeForm';

import './index.scss';
import { FORM_VARIANT } from '../util';

const DEFAULT_MIN_CHARS = 3;

/**
 * Generate the field component for a form. Uses the property model to decide
 * the component type to render. Factory wrapper which standardized form fields.
 *
 * @param {object} props
 * @param {PropertyModel} props.model the property model which defines the property type and other requirements
 * @param {Schema} props.schema the schema object
 * @param {function} props.onValueChange the function to update the parent form
 * @param {*} props.value the initial value of the field
 * @param {Error} props.error the error object if any
 * @param {string} props.label the label to use for the form field (defaults to the property model name)
 * @param {string} props.variant the form variant to be passed down to embedded forms
 */
const FormField = (props) => {
  const {
    className = '',
    error,
    onValueChange,
    model,
    schema,
    value: inputValue,
    disabled = false,
    variant = 'view',
    label = null,
    isPutativeEdge = false,
  } = props;

  const {
    choices,
    default: defaultValue,
    description,
    example,
    generateDefault,
    linkedClass,
    name,
    type,
    nullable,
  } = model;

  const generated = Boolean(model.generated && variant !== FORM_VARIANT.SEARCH);
  const mandatory = Boolean(model.mandatory && variant !== FORM_VARIANT.SEARCH);

  let value = inputValue;
  if (variant !== FORM_VARIANT.SEARCH) {
    if (value === undefined || (!nullable && value === null)) {
      if (defaultValue !== undefined) {
        value = defaultValue;
      } else if (generateDefault) {
        value = generateDefault();
      }
    }
  }

  if (value !== inputValue) {
    onValueChange({ target: { name, value } });
  }

  let propComponent;
  const errorFlag = error && !generated;

  if (type === 'boolean') {
    propComponent = (
      <BooleanField
        disabled={generated || disabled}
        error={!!error}
        label={label || model.name}
        name={model.name}
        onValueChange={onValueChange}
        required={mandatory}
        value={value}
      />
    );
  } else if (type === 'embeddedset') {
    propComponent = (
      <TextArrayField
        error={error}
        label={label || name}
        value={value}
        model={model}
        name={name}
        onValueChange={onValueChange}
        disabled={disabled || generated}
      />
    );
  } else if (type === 'embedded' && model.linkedClass && model.linkedClass.name === 'Permissions') {
    // permissions table of checkboxes
    propComponent = (
      <PermissionsTable
        label={label || name}
        value={value}
        model={model}
        name={name}
        onValueChange={onValueChange}
        disabled={disabled || generated}
      />
    );
  } else if (type === 'embedded') {
    propComponent = (
      <EmbeddedNodeForm
        error={!!error}
        label={label || name}
        modelName={model.linkedClass.name}
        name={name}
        onValueChange={onValueChange}
        schema={schema}
        value={value}
        variant={variant}
      />
    );
  } else if (choices) {
    propComponent = (
      <ResourceSelectComponent
        name={name}
        required={mandatory}
        onChange={onValueChange}
        resources={['', ...choices]}
        label={label || name}
        value={value || ''}
        errorText={errorFlag ? error.message || error : ''}
        disabled={generated || disabled}
      />
    );
  } else if (type === 'link' || type === 'linkset') {
    const autoProps = {
      disabled: generated || disabled,
      errorText: errorFlag ? error.message || error : '',
      isMulti: type === 'linkset',
      label: label || name,
      minSearchLength: DEFAULT_MIN_CHARS,
      name,
      onChange: onValueChange,
      required: mandatory,
      value,
      DetailChipProps: {
        getLink: details => `/view/${details['@rid'].slice(1)}`,
      },
    };

    if (linkedClass && (linkedClass.isAbstract || isPutativeEdge)) {
      autoProps.isPutativeEdge = isPutativeEdge;
      autoProps.linkedClassName = linkedClass.name;
      propComponent = (
        <FilteredRecordAutocomplete
          {...autoProps}
        />
      );
    } else {
      const searchOptions = {};

      if (linkedClass) {
        if (['Source', 'UserGroup', 'User'].includes(linkedClass.name)) {
          autoProps.searchHandler = () => api.get(`${linkedClass.routeName}?neighbors=1`, { forceListReturn: true });
          autoProps.minSearchLength = 0;
        } else {
          if (linkedClass.name === 'Vocabulary') {
            autoProps.defaultOptionsHandler = () => api.get(
              `${linkedClass.routeName}?source[name]=bcgsc&neighbors=1`,
              { forceListReturn: true },
            );
          }
          autoProps.searchHandler = api.defaultSuggestionHandler(linkedClass, searchOptions);
        }
      } else {
        autoProps.searchHandler = api.defaultSuggestionHandler(schema.get('V'), searchOptions);
      }
      propComponent = (
        <RecordAutocomplete
          {...autoProps}
          DetailChipProps={{
            ...autoProps.DetailChipProps,
            valueToString: (record) => {
              if (record && record['@rid']) {
                return schema.getLabel(record, false);
              }
              if (Array.isArray(record)) {
                return `Array(${record.length})`;
              }
              return `${record}`;
            },
          }}
          getOptionLabel={opt => schema.getLabel(opt, false)}
        />
      );
    }
  } else {
    propComponent = (
      <TextField
        label={name}
        name={label || name}
        required={mandatory}
        value={value || ''}
        onChange={onValueChange}
        InputLabelProps={{ shrink: !!value }}
        error={errorFlag}
        helperText={errorFlag ? error.message : ''}
        disabled={generated || disabled}
        className="text-field"
        multiline
      />
    );
  }

  return (
    <ListItem component="li" key={name} className={`form-field form-field--${type} ${className}`}>
      <div className="form-field__content">
        {propComponent}
      </div>
      <FieldHelp
        className="form-field__help"
        description={description}
        example={example && example.toString()}
      />
    </ListItem>
  );
};


FormField.propTypes = {
  className: PropTypes.string,
  error: PropTypes.object,
  onValueChange: PropTypes.func.isRequired,
  model: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
  value: PropTypes.any,
  schema: PropTypes.object.isRequired,
  label: PropTypes.string,
  variant: PropTypes.string,
  isPutativeEdge: PropTypes.bool,
};


FormField.defaultProps = {
  className: '',
  error: null,
  disabled: false,
  label: null,
  variant: 'view',
  value: null,
  isPutativeEdge: false,
};


export default withKB(FormField);
