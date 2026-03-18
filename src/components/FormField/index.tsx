import './index.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import {
  TextField,
} from '@mui/material';
import React, { ReactNode, useContext } from 'react';

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
import Timestamp from './Timestamp';
import { BaseFormFieldProps } from './types';

const POSITION_CLASSES = [
  'Position',
  ...schemaDefn.descendants('Position', { excludeAbstract: false, includeSelf: true }),
];

interface FormFieldProps {
  /**
   * the property model which defines the property type and other requirements
   * @todo replace with type from schema
   */
  model: any;
  baseModel?: string;
  className?: string;
  disabled?: boolean;
  helperText?: string;
  /** props to pass to the inner form field element */
  innerProps?: {
    multiline?: boolean;
    rows?: number;
    variant?: 'outlined'
    inputProps?: {
      'data-test-id'?: string;
    },
  },
  /** the label to use for the form field (defaults to the property model name) */
  label?: string;
}

/**
 * Generate the field component for a form. Uses the property model to decide
 * the component type to render. Factory wrapper which standardized form fields.
 */
const FormField = ({
  className = '',
  model,
  disabled = false,
  label,
  innerProps = {},
  helperText: defaultHelperText,
  baseModel = '',
}: FormFieldProps) => {
  const {
    formIsDirty, formContent = {}, formErrors = {}, updateFieldEvent, formVariant,
  } = useContext(FormContext);

  const {
    choices,
    default: defaultValue,
    description,
    example,
    generateDefault,
    linkedClass: linkedClassName,
    linkedType,
    name,
    type,
    nullable,
    iterable,
    format,
  } = model;
  let linkedClass;

  if (typeof linkedClassName === 'string') {
    linkedClass = schemaDefn.get(linkedClassName);
  } else {
    linkedClass = linkedClassName;
  }

  const inputValue = formContent[name];
  const generated = Boolean(model.generated && formVariant !== FORM_VARIANT.SEARCH);
  const mandatory = Boolean(model.mandatory && formVariant !== FORM_VARIANT.SEARCH);

  const errorFlag = Boolean(formErrors[name] && !generated && formIsDirty);

  let helperText = defaultHelperText;

  if (!helperText) {
    if (errorFlag) {
      helperText = formErrors[name]!.message;
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

  let value = inputValue as any;

  if (formVariant !== FORM_VARIANT.SEARCH) {
    if (value === undefined || (!nullable && value === null)) {
      if (defaultValue !== undefined) {
        value = defaultValue;
      } else if (generateDefault) {
        value = generateDefault(formContent);
      }
    }
  }

  const sharedProps: BaseFormFieldProps<any> = {
    required: mandatory,
    error: errorFlag,
    disabled: generated || disabled,
    name,
    helperText,
    label: label || name,
    onChange: updateFieldEvent,
    value,
  };

  if (value !== inputValue) {
    updateFieldEvent({ target: { name, value } });
  }

  let propComponent: ReactNode;

  if (type === 'boolean') {
    propComponent = (
      <BooleanField
        {...sharedProps}
      />
    );
  } else if (type.includes('embedded') && linkedType === 'string' && iterable) {
    propComponent = (
      <TextArrayField
        {...sharedProps}
      />
    );
  } else if (type.includes('embedded') && linkedClass) {
    if (iterable && linkedClass.name === 'StatementReview') {
      propComponent = (
        <StatementReviewsTable
          {...sharedProps}
          value={sharedProps.value || []}
          variant={formVariant}
        />
      );
    } else if (linkedClass.name === 'Permissions') {
      // permissions table of checkboxes
      propComponent = (
        <PermissionsTable
          {...sharedProps}
        />
      );
    } else if (POSITION_CLASSES.includes(linkedClass.name)) {
      propComponent = (
        <PositionForm
          {...sharedProps}
          baseVariant={baseModel}
          variant={sharedProps.value && sharedProps.value['@class']}
        />
      );
    }
  } else if (choices) {
    propComponent = (
      <DropDownSelect
        {...sharedProps}
        className={className}
        innerProps={innerProps}
        options={[{ key: 'default', value: null, label: 'Not Specified' }, ...choices]}
        value={sharedProps.value || ''}
      />
    );
  } else if (type === 'link' || type === 'linkset') {
    const autoProps = {
      ...sharedProps,
      isMulti: type === 'linkset',
      className,
    };

    if (linkedClass && linkedClass.isAbstract && !disabled) {
      const filteredAutoProps: React.ComponentProps<typeof FilteredRecordAutocomplete> = {
        ...autoProps,
        linkedClassName: linkedClass.name,
      };

      // special case (KBDEV-790) to improve user inputs
      if (name === 'conditions' && linkedClass.name === 'Biomarker') {
        filteredAutoProps.filterOptions = [
          ...schemaDefn.descendants('Variant', { excludeAbstract: false, includeSelf: true }),
          'Disease',
          'CatalogueVariant',
        ];
        filteredAutoProps.defaultFilterClassName = 'Variant';
      } if (name === 'reference1') {
        filteredAutoProps.filterOptions = [
          'Signature',
          'Feature',
        ];
        filteredAutoProps.defaultFilterClassName = 'Feature';
      }
      propComponent = (
        <FilteredRecordAutocomplete
          {...filteredAutoProps}
        />
      );
    } else if (linkedClass && ['Source', 'UserGroup', 'User', 'EvidenceLevel', 'Vocabulary'].includes(linkedClass.name)) {
      propComponent = (
        <RecordAutocomplete
          {...autoProps}
          getQueryBody={() => ({
            target: `${linkedClass.name}`,
            orderBy: linkedClass.name === 'EvidenceLevel'
              ? ['source.sort', 'sourceId']
              : ['name'],
            neighbors: 1,
          })}
          singleLoad
        />
      );
    } else {
      propComponent = (
        <RecordAutocomplete
          {...autoProps}
          getQueryBody={api.getDefaultSuggestionQueryBody(linkedClass ?? schemaDefn.get('V'))}
        />
      );
    }
  } else if (type === 'long' && (['createdAt', 'deletedAt', 'updatedAt'].includes(name) || format === 'date')) {
    // timestamp type compoennt
    propComponent = (
      <Timestamp
        {...innerProps}
        {...sharedProps}
        helperText={sharedProps.helperText || ' '}
        inputProps={{ ...(innerProps?.inputProps || {}), 'data-testid': name }}
        value={sharedProps.value || ''}
      />
    );
  }

  if (!propComponent) {
    // for lack of better option default to text field as catch all
    propComponent = (
      <TextField
        multiline
        {...innerProps}
        className="text-field"
        disabled={sharedProps.disabled}
        error={sharedProps.error}
        helperText={sharedProps.helperText || ' '}
        InputLabelProps={{ shrink: !!sharedProps.value }}
        inputProps={{ ...(innerProps?.inputProps || {}), 'data-testid': sharedProps.name }}
        label={sharedProps.label}
        name={sharedProps.name}
        onChange={sharedProps.onChange}
        required={sharedProps.required}
        value={sharedProps.value || ''}
      />
    );
  }

  return (
    <FieldWrapper key={name} className={className} type={type}>
      {propComponent}
    </FieldWrapper>
  );
};

export default FormField;
