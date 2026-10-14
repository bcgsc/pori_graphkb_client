/* eslint-disable react/jsx-props-no-spreading */
import './index.scss';

import {
  TextField,
} from '@mui/material';
import { omit } from 'lodash';
import React from 'react';

import DropDownSelect from '@/components/DropDownSelect';
import { useFormContext } from '@/components/FormContext';
import RecordAutocomplete from '@/components/RecordAutocomplete';
import { FORM_VARIANT } from '@/components/util';
import api from '@/services/api';
import schemaDefn from '@/services/schema';

import BooleanField from './BooleanField';
import EmbeddedForm from './EmbeddedForm';
import FieldWrapper from './FieldWrapper';
import FilteredRecordAutocomplete from './FilteredRecordAutocomplete';
import PermissionsTable from './PermissionsTable';
import StatementReviewsTable from './StatementReviewsTable';
import TextArrayField from './TextArrayField';
import Timestamp from './Timestamp';

interface FormFieldProps {
  /**
   * the property model which defines the property type and other requirements
   */
  name: string;
  /** for embedded where the linkedClass is abstract, specifies the default linked class to use */
  defaultLinkedClass?: string;
  className?: string;
  disabled?: boolean;
  helperText?: string;
  /** props to pass to the inner form field element */
  innerProps?: {
    multiline?: boolean;
    rows?: number;
    variant?: 'outlined'
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
  name,
  disabled = false,
  label: labelProp,
  innerProps,
  helperText: defaultHelperText,
  defaultLinkedClass,
}: FormFieldProps) => {
  const form = useFormContext();

  const model = form.model.properties[name] ?? {};

  const {
    choices,
    description,
    examples,
    linkedClass: linkedClassName,
    linkedType,
    type = 'string',
    iterable,
    format,
    label: modelLabel,
  } = model;
  const label = labelProp ?? modelLabel;
  const example = examples?.[0];
  const linkedClass = schemaDefn.get(linkedClassName, false);

  const value = form.formContent[name];
  const generated = Boolean(model.generated && form.formVariant !== FORM_VARIANT.SEARCH);
  const mandatory = Boolean(model.mandatory && form.formVariant !== FORM_VARIANT.SEARCH);

  const errorFlag = Boolean(form.formErrors[name] && !generated && form.formIsDirty);

  let helperText = defaultHelperText;

  if (!helperText) {
    if (errorFlag) {
      helperText = form.formErrors[name]!.message;
    } else if (form.formVariant === FORM_VARIANT.EDIT && example !== undefined) {
      if (!description) {
        helperText = `ex. ${example}`;
      } else {
        helperText = `${description} (ex. ${example})`;
      }
    } else {
      helperText = description;
    }
  }

  // ensure all components both get and support
  // the following props
  const sharedEmbedProps = {
    disabled: (generated || disabled) && form.formVariant !== FORM_VARIANT.VIEW,
    label: label || name,
    name,
    required: mandatory,
    onChange: form.updateFieldEvent,
    value,
    readOnly: generated || form.formVariant === FORM_VARIANT.VIEW,
  } satisfies SharedProps<[
    React.ComponentProps<typeof StatementReviewsTable>,
    React.ComponentProps<typeof PermissionsTable>,
    React.ComponentProps<typeof EmbeddedForm>,
  ]>;
  const sharedProps = {
    ...sharedEmbedProps,
    error: errorFlag,
    helperText,
  } satisfies SharedProps<[
    React.ComponentProps<typeof BooleanField>,
    React.ComponentProps<typeof Timestamp>,
    React.ComponentProps<typeof TextField> & { readOnly?: boolean },
    React.ComponentProps<typeof TextArrayField>,
    React.ComponentProps<typeof DropDownSelect>,
    React.ComponentProps<typeof FilteredRecordAutocomplete>,
    React.ComponentProps<typeof RecordAutocomplete>,
  ]>;

  let propComponent;

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
          {...sharedEmbedProps}
          value={sharedProps.value || []}
        />
      );
    } else if (linkedClass.name === 'Permissions') {
      // permissions table of checkboxes
      propComponent = (
        <PermissionsTable
          {...sharedEmbedProps}
        />
      );
    } else {
      propComponent = (
        <EmbeddedForm
          {...sharedProps}
          defaultLinkedClass={defaultLinkedClass}
        />
      );
    }
  } else if (choices) {
    propComponent = (
      <DropDownSelect
        {...sharedProps}
        options={[{ key: 'default', value: null, label: 'Not Specified' }, ...choices as string[]]}
        value={sharedProps.value || ''}
      />
    );
  } else if (type === 'link' || type === 'linkset') {
    const autoProps = {
      ...sharedProps,
      isMulti: type === 'linkset',
      className,
    } satisfies SharedProps<[React.ComponentProps<typeof FilteredRecordAutocomplete>, React.ComponentProps<typeof RecordAutocomplete>]>;

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
    // timestamp type component
    propComponent = (
      <Timestamp
        {...sharedProps}
        value={sharedProps.value || ''}
      />
    );
  }

  if (!propComponent) {
    // for lack of better option default to text field as catch all
    propComponent = (
      <TextField
        {...omit(sharedProps, 'readOnly')}
        className="text-field"
        helperText={sharedProps.helperText || ' '}
        multiline={innerProps?.multiline ?? true}
        rows={innerProps?.rows}
        slotProps={{
          inputLabel: { shrink: !!sharedProps.value },
          htmlInput: { 'data-testid': name },
          input: { readOnly: sharedProps.readOnly, disableUnderline: sharedProps.readOnly },
        }}
        value={sharedProps.value || ''}
        variant={innerProps?.variant}
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
