import React, { useContext } from 'react';
import {
  ListItem,
  TextField,
} from '@material-ui/core';
import PropTypes from 'prop-types';

import api from '../../../services/api';
import ResourceSelectComponent from '../../ResourceSelectComponent';
import RecordAutocomplete from '../../RecordAutocomplete';
import { KBContext } from '../../KBContext';
import BooleanField from './BooleanField';
import TextArrayField from './TextArrayField';
import PermissionsTable from './PermissionsTable';
import FilteredRecordAutocomplete from './FilteredRecordAutocomplete';

// unavoidable circular dependency below
import EmbeddedRecord from './EmbeddedRecord';

import './index.scss';
import { FORM_VARIANT } from '../util';
import EmbeddedListTable from './StatementReviewsTable';

/**
 * Generate the field component for a form. Uses the property model to decide
 * the component type to render. Factory wrapper which standardized form fields.
 *
 * @param {object} props
 * @param {PropertyModel} props.model the property model which defines the property type and other requirements
 * @param {Schema} props.schema the schema object
 * @param {function} props.onChange the function to update the parent form
 * @param {function} props.onReviewSelection the function to toggle between statement reviews
 * @param {*} props.value the initial value of the field
 * @param {Error} props.error the error object if any
 * @param {string} props.label the label to use for the form field (defaults to the property model name)
 * @param {string} props.variant the form variant to be passed down to embedded forms
 * @param {object} props.reviewProps object to be passed to EmbeddedListTable for review display
 * @param {object} props.innerProps props to pass to the inner form field element
 * @param {bool} props.formIsDirty flag to indicate changes have been made to the form content
 */
const FormField = (props) => {
  const { schema } = useContext(KBContext);
  const {
    className = '',
    error,
    onChange,
    model,
    value: inputValue,
    disabled = false,
    variant = 'view',
    label = null,
    innerProps,
    formIsDirty = true,
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
    iterable,
  } = model;
  console.log('TCL: model', model);

  const generated = Boolean(model.generated && variant !== FORM_VARIANT.SEARCH);
  const mandatory = Boolean(model.mandatory && variant !== FORM_VARIANT.SEARCH);

  const errorFlag = error && !generated && formIsDirty;

  let helperText;

  if (errorFlag) {
    helperText = error.message;
  } else if (variant === FORM_VARIANT.EDIT && example !== undefined) {
    if (!description) {
      helperText = `ex. ${example}`;
    } else {
      helperText = `${description} (ex. ${example})`;
    }
  } else {
    helperText = description;
  }


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
    onChange({ target: { name, value } });
  }

  let propComponent;

  if (type === 'boolean') {
    propComponent = (
      <BooleanField
        disabled={generated || disabled}
        error={!!error}
        label={label || model.name}
        name={model.name}
        onChange={onChange}
        required={mandatory}
        value={value}
        helperText={helperText}
      />
    );
  } else if (type.includes('embedded')) {
    if (iterable) {
      if (model.linkedClass && model.linkedClass.name === 'StatementReview') {
        propComponent = (
          <EmbeddedListTable
            label={name}
            values={value || []}
            variant={variant}
            onChange={onChange}
            name={name}
          />
        );
      } else {
        propComponent = (
          <TextArrayField
            error={error}
            label={label || name}
            value={value}
            model={model}
            name={name}
            onChange={onChange}
            disabled={disabled || generated}
            helperText={helperText}
          />
        );
      }
    } else if (model.linkedClass) {
      if (model.linkedClass.name === 'Permissions') {
        // permissions table of checkboxes
        propComponent = (
          <PermissionsTable
            label={label || name}
            value={value}
            model={model}
            name={name}
            onChange={onChange}
            disabled={disabled || generated}
          />
        );
      } else {
        const linkedModel = value && value['@class']
          ? value['@class']
          : model.linkedClass.name;

        propComponent = (
          <EmbeddedRecord
            errors={error}
            label={label || name}
            modelName={linkedModel}
            name={name}
            onChange={onChange}
            value={value}
            variant={variant}
            disabled={disabled}
            helperText={helperText}
          />
        );
      }
    }
  } else if (choices) {
    propComponent = (
      <ResourceSelectComponent
        name={name}
        required={mandatory}
        onChange={onChange}
        resources={['', ...choices]}
        label={label || name}
        value={value || ''}
        error={errorFlag}
        helperText={helperText}
        disabled={generated || disabled}
        className={className}
      />
    );
  } else if (type === 'link' || type === 'linkset') {
    const autoProps = {
      disabled: generated || disabled,
      error: errorFlag,
      isMulti: type === 'linkset',
      label: label || name,
      name,
      onChange,
      required: mandatory,
      value,
      helperText,
      DetailChipProps: {
        getLink: schema.getLink,
      },
    };

    if (linkedClass && linkedClass.isAbstract) {
      autoProps.linkedClassName = linkedClass.name;
      propComponent = (
        <FilteredRecordAutocomplete
          {...autoProps}
        />
      );
    } else {
      const searchOptions = {};

      if (linkedClass) {
        if (['Source', 'UserGroup', 'User', 'EvidenceLevel', 'Vocabulary'].includes(linkedClass.name)) {
          autoProps.searchHandler = () => api.get(`${
            linkedClass.routeName
          }?neighbors=1&orderBy=${
            linkedClass.name === 'EvidenceLevel'
              ? 'sourceId'
              : 'name'
          }`, { forceListReturn: true });
          autoProps.singleLoad = true;
        } else {
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
        {...innerProps}
        label={name}
        name={label || name}
        required={mandatory}
        value={value || ''}
        onChange={onChange}
        InputLabelProps={{ shrink: !!value }}
        inputProps={{ ...(innerProps.inputProps || {}), 'data-testid': name }}
        error={errorFlag}
        helperText={helperText}
        disabled={generated || disabled}
        className="text-field"
      />
    );
  }

  return (
    <ListItem component="li" key={name} className={`form-field form-field--${type} ${className}`}>
      <div className="form-field__content">
        {propComponent}
      </div>
    </ListItem>
  );
};


FormField.propTypes = {
  className: PropTypes.string,
  error: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  model: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
  value: PropTypes.any,
  label: PropTypes.string,
  variant: PropTypes.string,
  innerProps: PropTypes.object,
  formIsDirty: PropTypes.bool,
};


FormField.defaultProps = {
  className: '',
  error: null,
  disabled: false,
  label: null,
  variant: 'view',
  value: null,
  innerProps: {},
  formIsDirty: false,
};


export default FormField;
