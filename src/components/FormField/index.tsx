/* eslint-disable react/jsx-props-no-spreading */
import './index.scss';

import {
  Dialog,
  DialogContent,
  TextField,
} from '@mui/material';
import { omit } from 'lodash';
import React, {
  ReactNode,
  useCallback, useEffect, useMemo, useState, useTransition,
} from 'react';

import DropDownSelect from '@/components/DropDownSelect';
import { shouldHideField, useFormContext } from '@/components/hooks/useSchemaForm';
import RecordAutocomplete from '@/components/RecordAutocomplete';
import { FORM_VARIANT } from '@/components/util';
import api from '@/services/api';
import schemaDefn from '@/services/schema';

import { useAuth } from '../Auth';
import { LayoutItem } from '../FormLayout';
import RadioSelect from '../RadioSelect';
import RecordForm from '../RecordForm';
import type { GeneralRecordType } from '../types';
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

  const value = form.content[name];

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

function LinkableFormField(props: ReturnType<typeof useFormField>['props'] & { model: ReturnType<typeof useFormField>['model'] }) {
  const {
    model, name, onChange, value, ...rest
  } = props;
  const auth = useAuth();
  const {
    linkedClass: linkedClassName,
    type = 'string',
  } = model;
  const linkedClass = schemaDefn.get(linkedClassName, false);
  const allowCreate = linkedClass?.allowCreateInPopup && auth.hasWriteAccess;
  const [createDialogModelName, setCreateDialogModelName] = useState<string | null>(null);
  const createModel = schemaDefn.get(createDialogModelName || 'V', false);
  const createAbstractDialogChoices = useMemo(() => {
    if (!createModel?.isAbstract) return [];
    return schemaDefn.descendants(createModel.name, { excludeAbstract: true, includeSelf: true }).filter((name) => schemaDefn.get(name).allowCreateInPopup).map((name) => ({
      label: name,
      value: name,
      caption: schemaDefn.get(name).description,
      key: name,
    })).sort((m1, m2) => m1.label.localeCompare(m2.label));
  }, [createModel]);
  const handleOpenCreateDialog = useCallback((modelName?: string) => {
    setCreateDialogModelName(modelName ?? linkedClass?.name ?? null);
  }, [linkedClass?.name]);

  const handleProcessCreatedRecord = useCallback((newRecord: GeneralRecordType | undefined) => {
    // append the newly created record to the field value
    if (type === 'linkset') {
      if (!value?.length) {
        onChange({ target: { name, value: [newRecord] } });
      } else {
        onChange({ target: { name, value: [...value, newRecord] } });
      }
    } else {
      onChange({ target: { name, value: newRecord } });
    }
    setCreateDialogModelName(null);
  }, [type, value, onChange, name]);

  let propComponent: ReactNode;
  const autoProps = {
    ...rest,
    onChange,
    value,
    name,
    allowCreate,
    isMulti: type === 'linkset',
  } satisfies SharedProps<[React.ComponentProps<typeof FilteredRecordAutocomplete>, React.ComponentProps<typeof RecordAutocomplete>]>;

  if (linkedClass && linkedClass.isAbstract && !(rest.readOnly || rest.disabled)) {
    const filteredAutoProps: React.ComponentProps<typeof FilteredRecordAutocomplete> = {
      ...autoProps,
      linkedClassName: linkedClass.name,
      filterOptions: model.componentProps?.filterOptions,
      defaultFilterClassName: model.componentProps?.defaultFilterClassName,
    };

    propComponent = (
      <FilteredRecordAutocomplete
        {...filteredAutoProps}
        onCreate={handleOpenCreateDialog}
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
        onCreate={handleOpenCreateDialog}
        singleLoad
      />
    );
  } else {
    propComponent = (
      <RecordAutocomplete
        {...autoProps}
        getQueryBody={api.getDefaultSuggestionQueryBody(linkedClass ?? schemaDefn.get('V'))}
        onCreate={handleOpenCreateDialog}
      />
    );
  }

  return (
    <>
      {propComponent}
      {Boolean(createDialogModelName) && createModel?.isAbstract && (
        <Dialog
          fullWidth
          maxWidth="md"
          onClose={() => setCreateDialogModelName(null)}
          open
          slotProps={{ paper: { 'aria-label': 'Choose a record type to create' } }}
        >
          <DialogContent>
            <RadioSelect
              onChange={(e) => {
                setCreateDialogModelName(e.target.value as string);
              }}
              options={createAbstractDialogChoices}
              value=""
            />
          </DialogContent>
        </Dialog>
      )}
      {Boolean(createDialogModelName) && !createModel?.isAbstract && (
        <RecordForm
          formType="dialog"
          modelName={createDialogModelName!}
          onClose={() => setCreateDialogModelName(null)}
          onSubmit={handleProcessCreatedRecord}
          open
          variant={FORM_VARIANT.NEW}
        />
      )}
    </>
  );
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
    propComponent = (
      <LinkableFormField
        {...field.props}
        model={field.model}
      />
    );
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
