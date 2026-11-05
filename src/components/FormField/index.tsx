/* eslint-disable react/jsx-props-no-spreading */
import './index.scss';

import {
  TextField,
} from '@mui/material';
import { omit } from 'lodash';
import React, {
  useCallback, useEffect, useState, useTransition,
} from 'react';

import DropDownSelect from '@/components/DropDownSelect';
import { shouldHideField, useFormContext } from '@/components/hooks/useSchemaForm';
import RecordAutocomplete from '@/components/RecordAutocomplete';
import { FORM_VARIANT } from '@/components/util';
import api from '@/services/api';
import schemaDefn from '@/services/schema';

import { LayoutItem } from '../FormLayout';
import BooleanField from './BooleanField';
import EmbeddedForm from './EmbeddedForm';
import FilteredRecordAutocomplete from './FilteredRecordAutocomplete';
import PermissionsTable from './PermissionsTable';
import StatementReviewsTable from './StatementReviewsTable';
import TextArrayField from './TextArrayField';
import Timestamp from './Timestamp';

export function useFormField(name: string, options?: { label?: string, disabled?: boolean }) {
  const form = useFormContext();
  const { updateFieldEvent } = form;

  const model = form.model.properties[name] ?? {};

  const {
    description,
    examples,
    label: modelLabel,
  } = model;
  const label = options?.label ?? modelLabel;
  const example = examples?.[0];

  const formValue = form.content[name];
  const [value, setValue] = useState(formValue);
  useEffect(() => setValue(formValue), [formValue]);

  const generated = Boolean(model.generated && form.variant !== FORM_VARIANT.SEARCH);
  const mandatory = Boolean(model.mandatory && form.variant !== FORM_VARIANT.SEARCH);
  const validation = form.validation.properties?.[name] ?? { valid: true };
  const errorFlag = Boolean(!validation.valid && !generated && form.isDirty);

  let helperText: string | undefined;

  if (!helperText) {
    if (errorFlag) {
      helperText = validation.message;
    } else if (form.variant === FORM_VARIANT.EDIT && example !== undefined) {
      if (!description) {
        helperText = `ex. ${example}`;
      } else {
        helperText = `${description} (ex. ${example})`;
      }
    } else {
      helperText = description;
    }
  }

  const props = {
    disabled: (model.readOnly || generated || form.disabled || (form.model.isEdge && form.variant === FORM_VARIANT.EDIT)) && form.variant !== FORM_VARIANT.VIEW || options?.disabled,
    label: label || name,
    name,
    required: mandatory,
    onChange: updateFieldEvent,
    value,
    readOnly: model.readOnly || generated || form.variant === FORM_VARIANT.VIEW,
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

  return {
    props,
    model,
    value,
    hide: shouldHideField(form.variant, model, value),
  };
}

interface FormFieldProps {
  /**
   * the property model which defines the property type and other requirements
   */
  name: string;
  /** for embedded where the linkedClass is abstract, specifies the default linked class to use */
  defaultLinkedClass?: string;
  /** the label to use for the form field (defaults to label specified on property model) */
  label?: string;
  /**
   * to override the forms normal behaviour and disable the field.
   * if you set to false but the form has true, this will still be disabled.
   * if true, the field will be disabled regardless of the form's state.
   */
  disabled?: boolean;
}

/**
 * Generate the field component for a form. Uses the property model to decide
 * the component type to render. Factory wrapper which standardized form fields.
 */
const FormField = ({
  name,
  label: labelProp,
  defaultLinkedClass,
  disabled: disabledProp,
}: FormFieldProps) => {
  const form = useFormContext();
  const { updateFieldEvent } = form;
  const field = useFormField(name, { label: labelProp, disabled: disabledProp });

  const {
    choices,
    linkedClass: linkedClassName,
    linkedType,
    type = 'string',
    iterable,
    format,
  } = field.model;
  const linkedClass = schemaDefn.get(linkedClassName, false);

  const formValue = form.content[name];
  const [value, setValue] = useState(formValue);
  useEffect(() => setValue(formValue), [formValue]);
  const [_, startTransition] = useTransition();

  const handleChange = useCallback((params: Parameters<typeof updateFieldEvent>[0]) => {
    const newValue = params.target.value;
    setValue(newValue);
    startTransition(() => {
      updateFieldEvent(params);
    });
  }, [updateFieldEvent]);

  if (field.hide) return null;

  const sharedProps = {
    ...field.props,
    onChange: handleChange,
    value,
  };

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
          {...field.props}
          value={sharedProps.value || []}
        />
      );
    } else if (linkedClass.name === 'Permissions') {
      // permissions table of checkboxes
      propComponent = (
        <LayoutItem fullWidth>
          <PermissionsTable
            {...field.props}
          />
        </LayoutItem>
      );
    } else {
      propComponent = (
        <LayoutItem outlined>
          <EmbeddedForm
            {...sharedProps}
            defaultLinkedClass={defaultLinkedClass}
          />
        </LayoutItem>
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
    } satisfies SharedProps<[React.ComponentProps<typeof FilteredRecordAutocomplete>, React.ComponentProps<typeof RecordAutocomplete>]>;

    if (linkedClass && linkedClass.isAbstract && !(field.props.readOnly || field.props.disabled)) {
      const filteredAutoProps: React.ComponentProps<typeof FilteredRecordAutocomplete> = {
        ...autoProps,
        linkedClassName: linkedClass.name,
        filterOptions: field.model.componentProps?.filterOptions,
        defaultFilterClassName: field.model.componentProps?.defaultFilterClassName,
      };

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
        fullWidth
        helperText={sharedProps.helperText || ' '}
        multiline={field.model.componentProps?.multiline ?? true}
        rows={field.model.componentProps?.multiline ? 7 : undefined}
        slotProps={{
          inputLabel: { shrink: !!sharedProps.value },
          htmlInput: { 'data-testid': name },
          input: { readOnly: sharedProps.readOnly, disableUnderline: sharedProps.readOnly },
        }}
        value={sharedProps.value || ''}
        variant={field.model.componentProps?.multiline ? 'outlined' : undefined}
      />
    );
  }

  return propComponent;
};

export default FormField;
