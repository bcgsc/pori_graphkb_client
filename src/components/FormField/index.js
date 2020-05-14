import './index.scss';

import {
  TextField,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React, { useContext } from 'react';

import DropDownSelect from '@/components/DropDownSelect';
import FormContext from '@/components/FormContext';
import RecordAutocomplete from '@/components/RecordAutocomplete';
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

const POSITION_CLASSES = [
  'Position',
  ...schema.schema.Position.descendantTree(false).map(m => m.name),
];

/**
 * Generate the field component for a form. Uses the property model to decide
 * the component type to render. Factory wrapper which standardized form fields.
 *
 * @param {object} props
 * @param {PropertyModel} props.model the property model which defines the property type and other requirements
 * @param {string} props.label the label to use for the form field (defaults to the property model name)
 * @param {object} props.innerProps props to pass to the inner form field element
 */
const FormField = ({
  className = '',
  model,
  disabled = false,
  label = null,
  innerProps,
  helperText: defaultHelperText,
  baseModel,
}) => {
  const {
    formIsDirty, formContent = {}, formErrors = {}, updateFieldEvent, formVariant,
  } = useContext(FormContext);

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

  const inputValue = formContent[name];
  const generated = Boolean(model.generated && formVariant !== FORM_VARIANT.SEARCH);
  const mandatory = Boolean(model.mandatory && formVariant !== FORM_VARIANT.SEARCH);

  const errorFlag = formErrors[name] && !generated && formIsDirty;

  let helperText = defaultHelperText;

  if (!helperText) {
    if (errorFlag) {
      helperText = formErrors[name].message;
    } else if (formVariant === FORM_VARIANT.EDIT && example !== undefined) {
      if (!description) {
        helperText = `ex. ${example}`;
      } else {
        helperText = `${description} (ex. ${example})`;
      }
    } else {
      helperText = description;
    }
  }

  let value = inputValue;

  if (formVariant !== FORM_VARIANT.SEARCH) {
    if (value === undefined || (!nullable && value === null)) {
      if (defaultValue !== undefined) {
        value = defaultValue;
      } else if (generateDefault) {
        value = generateDefault(formContent);
      }
    }
  }

  if (value !== inputValue) {
    updateFieldEvent({ target: { name, value } });
  }

  let propComponent;

  if (type === 'boolean') {
    propComponent = (
      <BooleanField
        disabled={generated || disabled}
        error={errorFlag}
        helperText={helperText}
        label={label || name}
        name={name}
        onChange={updateFieldEvent}
        required={mandatory}
        value={value}
      />
    );
  } else if (type.includes('embedded') && linkedType === 'string' && iterable) {
    propComponent = (
      <TextArrayField
        disabled={disabled || generated}
        error={errorFlag}
        helperText={helperText}
        label={label || name}
        model={model}
        name={name}
        onChange={updateFieldEvent}
        value={value}
      />
    );
  } else if (type.includes('embedded') && linkedClass) {
    if (iterable && linkedClass.name === 'StatementReview') {
      propComponent = (
        <StatementReviewsTable
          label={name}
          name={name}
          onChange={updateFieldEvent}
          values={value || []}
          variant={formVariant}
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
          onChange={updateFieldEvent}
          value={value}
        />
      );
    } else if (POSITION_CLASSES.includes(linkedClass.name)) {
      propComponent = (
        <PositionForm
          baseVariant={baseModel}
          disabled={disabled}
          error={errorFlag}
          helperText={helperText}
          label={label || name}
          name={name}
          onChange={updateFieldEvent}
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
        onChange={updateFieldEvent}
        options={[{ key: 'default', value: null, label: 'Not Specified' }, ...choices]}
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
      onChange: updateFieldEvent,
      required: mandatory,
      value,
      helperText,
      innerProps,
      DetailChipProps: {
        getLink: schema.getLink,
      },
    };

    if (linkedClass && linkedClass.isAbstract && !disabled) {
      autoProps.linkedClassName = linkedClass.name;

      // special case (KBDEV-790) to improve user inputs
      if (name === 'conditions' && linkedClass.name === 'Biomarker') {
        autoProps.filterOptions = [
          ...schema.schema.Variant.descendantTree(false).map(m => m.name),
          'Disease',
          'CatalogueVariant',
        ];
        autoProps.defaultFilterClassName = 'Variant';
      } if (name === 'reference1') {
        autoProps.filterOptions = [
          'Signature',
          'Feature',
        ];
        autoProps.defaultFilterClassName = 'Feature';
      }
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
        onChange={updateFieldEvent}
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
    choices: PropTypes.arrayOf(PropTypes.oneOfType([
      PropTypes.shape({
        key: PropTypes.string,
        label: PropTypes.string,
        value: PropTypes.string,
        caption: PropTypes.string,
      }),
      PropTypes.string,
    ])),
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
  baseModel: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  helperText: PropTypes.string,
  innerProps: PropTypes.shape({
    inputProps: PropTypes.shape({
      'data-test-id': PropTypes.string,
    }),
  }),
  label: PropTypes.string,
};


FormField.defaultProps = {
  className: '',
  disabled: false,
  label: null,
  innerProps: {},
  helperText: '',
  baseModel: '',
};


export default FormField;
