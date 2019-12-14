import './index.scss';

import {
  TextField,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

import DropDownSelect from '@/components/DropDownSelect';
import RecordAutocomplete from '@/components/RecordAutocomplete';
import { GeneralRecordPropType } from '@/components/types';
import { FORM_VARIANT } from '@/components/util';
import api from '@/services/api';
import schema from '@/services/schema';

import BooleanField from './BooleanField';
import FieldWrapper from './FieldWrapper';
import FilteredRecordAutocomplete from './FilteredRecordAutocomplete';
import PermissionsTable from './PermissionsTable';
import PositionForm from './PositionForm';
import StatementReviewsTable from './StatementReviewsTable';
import TextArrayField from './TextArrayField';

/**
 * Generate the field component for a form. Uses the property model to decide
 * the component type to render. Factory wrapper which standardized form fields.
 *
 * @param {object} props
 * @param {PropertyModel} props.model the property model which defines the property type and other requirements
 * @param {function} props.onChange the function to update the parent form
 * @param {function} props.onReviewSelection the function to toggle between statement reviews
 * @param {*} props.value the initial value of the field
 * @param {Error} props.error the error object if any
 * @param {string} props.label the label to use for the form field (defaults to the property model name)
 * @param {string} props.variant the form variant to be passed down to embedded forms
 * @param {object} props.innerProps props to pass to the inner form field element
 * @param {bool} props.formIsDirty flag to indicate changes have been made to the form content
 */
const FormField = (props) => {
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
    linkedType,
    name,
    type,
    nullable,
    iterable,
  } = model;

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
        helperText={helperText}
        label={label || model.name}
        name={model.name}
        onChange={onChange}
        required={mandatory}
        value={value}
      />
    );
  } else if (type.includes('embedded') && linkedType === 'string' && iterable) {
    propComponent = (
      <TextArrayField
        disabled={disabled || generated}
        error={error}
        helperText={helperText}
        label={label || name}
        model={model}
        name={name}
        onChange={onChange}
        value={value}
      />
    );
  } else if (type.includes('embedded') && linkedClass) {
    if (iterable && linkedClass.name === 'StatementReview') {
      propComponent = (
        <StatementReviewsTable
          label={name}
          name={name}
          onChange={onChange}
          values={value || []}
          variant={variant}
        />
      );
    } else if (linkedClass.name === 'Permissions') {
      // permissions table of checkboxes
      propComponent = (
        <PermissionsTable
          disabled={disabled || generated}
          label={label || name}
          model={model}
          name={name}
          onChange={onChange}
          value={value}
        />
      );
    } else if (linkedClass.name === 'Position') {
      propComponent = (
        <PositionForm
          disabled={disabled}
          error={error && formIsDirty}
          helperText={helperText}
          label={label || name}
          name={name}
          onChange={onChange}
          value={value}
          variant={value && value['@class']}
        />
      );
    }
  } else if (choices) {
    propComponent = (
      <DropDownSelect
        className={className}
        disabled={generated || disabled}
        error={errorFlag}
        helperText={helperText}
        innerProps={innerProps}
        label={label || name}
        name={name}
        onChange={onChange}
        options={['', ...choices]}
        required={mandatory}
        value={value || ''}
      />
    );
  } else if (type === 'link' || type === 'linkset') {
    const autoProps = {
      disabled: generated || disabled,
      error: errorFlag,
      isMulti: type === 'linkset',
      label: label || name,
      className,
      name,
      onChange,
      required: mandatory,
      value,
      helperText,
      innerProps,
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
          autoProps.searchHandler = () => api.post('/query', {
            target: `${linkedClass.name}`,
            orderBy: linkedClass.name === 'EvidenceLevel'
              ? ['source.sort', 'sourceId']
              : ['name'],
            neighbors: 1,
          }, { forceListReturn: true });
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
          innerProps={innerProps}
        />
      );
    }
  }

  if (!propComponent) {
    // for lack of better option default to text field as catch all
    propComponent = (
      <TextField
        {...innerProps}
        className="text-field"
        disabled={generated || disabled}
        error={errorFlag}
        helperText={helperText || ' '}
        InputLabelProps={{ shrink: !!value }}
        inputProps={{ ...(innerProps.inputProps || {}), 'data-testid': name }}
        label={name}
        name={label || name}
        onChange={onChange}
        required={mandatory}
        value={value || ''}
      />
    );
  }

  return (
    <FieldWrapper key={name} className={className} type={type}>
      {propComponent}
    </FieldWrapper>
  );
};


FormField.propTypes = {
  model: PropTypes.shape({
    choices: PropTypes.arrayOf(PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.string,
      value: PropTypes.string,
      caption: PropTypes.string,
    })),
    default: PropTypes.string,
    description: PropTypes.string,
    example: PropTypes.string,
    generateDefault: PropTypes.func,
    linkedClass: PropTypes.shape({
      name: PropTypes.string,
      '@rid': PropTypes.string,
      displayName: PropTypes.string,
      isAbstract: PropTypes.bool,
    }),
    linkedType: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    nullable: PropTypes.bool,
    iterable: PropTypes.bool,
    generated: PropTypes.bool,
    mandatory: PropTypes.bool,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.shape({
    name: PropTypes.string,
    message: PropTypes.string,
  }),
  formIsDirty: PropTypes.bool,
  innerProps: PropTypes.shape({
    inputProps: PropTypes.shape({
      'data-test-id': PropTypes.string,
    }),
  }),
  label: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.arrayOf(GeneralRecordPropType),
    GeneralRecordPropType,
  ]),
  variant: PropTypes.string,
};


FormField.defaultProps = {
  className: '',
  error: null,
  disabled: false,
  label: null,
  variant: 'view',
  value: null,
  innerProps: {},
  formIsDirty: true,
};


export default FormField;
