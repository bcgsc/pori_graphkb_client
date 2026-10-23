import './index.scss';

import {
  Alert,
  CircularProgress,
  Paper, Typography,
} from '@mui/material';
import React from 'react';

import ActionButton from '@/components/ActionButton';
import FormLayout from '@/components/FormLayout';
import useSchemaForm, { FormContext, useFormContext } from '@/components/hooks/useSchemaForm';
import RecordFormStateToggle from '@/components/RecordFormStateToggle';
import { EdgeType, GeneralRecordType } from '@/components/types';
import { FORM_VARIANT } from '@/components/util';
import { ErrorMessage } from '@/services/errors';
import schemaDefn from '@/services/schema';

import { useAuth } from '../Auth';
import EdgeSentence from '../SentencePreview/EdgeSentence';
import EdgeTable from './EdgeTable';
import RelatedStatementsTable from './RelatedStatementsTable';
import RelatedVariantsTable from './RelatedVariantsTable';

function FormActions() {
  const form = useFormContext();
  return (
    <div className="record-form__action-buttons">
      {form.variant === FORM_VARIANT.EDIT && !form.content.deletedAt
        ? (
          <ActionButton
            color="error"
            disabled={form.action.inProgress}
            message="Are you sure you want to delete this record?"
            onClick={form.action.delete}
            variant="outlined"
          >
            DELETE RECORD
          </ActionButton>
        )
        // for spacing issues only
        : (<div />)}
      {form.action.inProgress && (
        <CircularProgress size={50} />
      )}
      {form.variant === FORM_VARIANT.NEW || (form.variant === FORM_VARIANT.EDIT && !form.model.isEdge && !form.content.deletedAt)
        ? (
          <ActionButton
            color="primary"
            disabled={form.action.inProgress || (!form.validation.valid && form.isDirty)}
            onClick={form.action.submit}
            requireConfirm={false}
            variant="contained"
          >
            {form.variant === FORM_VARIANT.EDIT && !form.content.deletedAt
              ? 'SUBMIT CHANGES'
              : 'SUBMIT'}
          </ActionButton>
        )
        // for spacing issues only
        : (<div />)}
    </div>
  );
}

interface FormHeaderProps {
  title: string;
  actions?: React.ReactNode;
  onToggleState?: (newState: FORM_VARIANT | 'graph') => void;
}

function FormHeader({
  title, onToggleState, actions,
}: FormHeaderProps) {
  const auth = useAuth();
  const form = useFormContext();
  let pageTitle = title;
  const subtitle = title;

  if (form.variant === FORM_VARIANT.VIEW && form.content) {
    if (form.content.displayName) {
      pageTitle = `${form.content.displayName} (${form.content['@rid']})`;
    } else {
      pageTitle = `${form.content['@class']} ${form.content['@rid']}`;
    }
  }
  return (
    <div className="record-form__header">
      <span className="title">
        <Typography variant="h1">{pageTitle}</Typography>
        {subtitle !== pageTitle && (<Typography variant="subtitle1">{subtitle}</Typography>)}
      </span>
      <div className={`header__actions header__actions--${form.variant}`}>
        {actions}
        {onToggleState && (form.variant === FORM_VARIANT.VIEW || form.variant === FORM_VARIANT.EDIT) && (
          <RecordFormStateToggle
            allowEdit={auth.hasWriteAccess && !form.content.deletedAt}
            message="Are you sure? You will lose your changes."
            onClick={onToggleState}
            requireConfirm={form.variant === FORM_VARIANT.EDIT && form.isDirty}
            value={form.variant}
          />
        )}
      </div>
    </div>
  );
}

function FormErrors() {
  const form = useFormContext();
  return (
    <>
      <ErrorMessage error={form.action.error}>{form.action.errorMessage}</ErrorMessage>
      {form.validation.message && (
        <Alert severity="error">{form.validation.message}</Alert>
      )}
    </>
  );
}

interface RecordFormProps {
  /** the title for this form */
  title: string;
  /** name of class model to be displayed */
  modelName?: string;
  onSubmit?: (record?: GeneralRecordType) => void;
  onToggleState?: (newState: FORM_VARIANT | 'graph') => void;
  /** values of individual properties of passed class model */
  value?: GeneralRecordType;
  /** the type of NodeForm to create */
  variant?: FORM_VARIANT.EDIT | FORM_VARIANT.NEW | FORM_VARIANT.VIEW;
}

/**
 * Form/View that displays the contents of a single node
 */
const RecordForm = ({
  value: initialValue,
  modelName = '',
  title,
  onToggleState,
  onSubmit,
  variant = FORM_VARIANT.VIEW,
}: RecordFormProps) => {
  const model = schemaDefn.get(modelName);

  const form = useSchemaForm(model, initialValue, { variant, onActionSuccess: onSubmit });

  return (
    <FormContext.Provider value={form}>
      <Paper className="record-form__wrapper" elevation={4}>
        <FormHeader onToggleState={onToggleState} title={title} />
        {form.model.isEdge && (
          <EdgeSentence
            srcRecord={(form.content as EdgeType).out}
            tgtRecord={(form.content as EdgeType).in}
            type={model.name}
          />
        )}
        <FormLayout
          collapseExtra
        />
        {modelName && variant === FORM_VARIANT.VIEW && schemaDefn.ancestors(modelName).includes('V') && (
          <>
            <EdgeTable recordId={String(form.content['@rid'])} />
            <RelatedStatementsTable recordId={String(form.content['@rid'])} />
            {schemaDefn.ancestors(modelName).includes('Ontology') && (
              <RelatedVariantsTable recordId={String(form.content['@rid'])} />
            )}
          </>
        )}
        <FormErrors />
        <FormActions />
      </Paper>
    </FormContext.Provider>
  );
};

export { FormActions, FormErrors, FormHeader };
export default RecordForm;
