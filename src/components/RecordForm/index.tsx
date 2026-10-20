import './index.scss';

import {
  CircularProgress,
  Paper, Typography,
} from '@mui/material';
import React from 'react';

import ActionButton from '@/components/ActionButton';
import FormLayout from '@/components/FormLayout';
import useSchemaForm, { FormContext } from '@/components/hooks/useSchemaForm';
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
  const auth = useAuth();

  const model = schemaDefn.get(modelName);

  const form = useSchemaForm(model, initialValue, { variant, onActionSuccess: onSubmit });

  let pageTitle = title;

  if (variant === FORM_VARIANT.VIEW && form.content) {
    if (form.content.displayName) {
      pageTitle = `${form.content.displayName} (${form.content['@rid']})`;
    } else {
      pageTitle = `${form.content['@class']} ${form.content['@rid']}`;
    }
  }

  return (
    <Paper className="record-form__wrapper" elevation={4}>
      <div className="record-form__header">
        <span className="title">
          <Typography variant="h1">{pageTitle}</Typography>
          {title !== pageTitle && (<Typography variant="subtitle1">{title}</Typography>)}
        </span>
        <div className={`header__actions header__actions--${variant}`}>
          {onToggleState && (variant === FORM_VARIANT.VIEW || variant === FORM_VARIANT.EDIT) && (
            <RecordFormStateToggle
              allowEdit={auth.hasWriteAccess && !form.content.deletedAt}
              message="Are you sure? You will lose your changes."
              onClick={onToggleState}
              requireConfirm={variant === 'edit' && form.isDirty}
              value={variant}
            />
          )}
        </div>
      </div>
      {form.model.isEdge && (
        <EdgeSentence
          srcRecord={(form.content as EdgeType).out}
          tgtRecord={(form.content as EdgeType).in}
          type={model.name}
        />
      )}
      <FormContext.Provider value={form}>
        <FormLayout
          collapseExtra
        />
      </FormContext.Provider>
      {modelName && variant === FORM_VARIANT.VIEW && schemaDefn.ancestors(modelName).includes('V') && (
        <>
          <EdgeTable recordId={String(form.content['@rid'])} />
          <RelatedStatementsTable recordId={String(form.content['@rid'])} />
          {schemaDefn.ancestors(modelName).includes('Ontology') && (
            <RelatedVariantsTable recordId={String(form.content['@rid'])} />
          )}
        </>
      )}
      <ErrorMessage error={form.action.error}>{form.action.errorMessage}</ErrorMessage>
      <div className="record-form__action-buttons">
        {variant === FORM_VARIANT.EDIT && !form.content.deletedAt
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
        {variant === FORM_VARIANT.NEW || (variant === FORM_VARIANT.EDIT && !model.isEdge)
          ? (
            <ActionButton
              color="primary"
              disabled={form.action.inProgress || (!form.validation.valid && form.isDirty)}
              onClick={form.action.submit}
              requireConfirm={false}
              variant="contained"
            >
              {variant === FORM_VARIANT.EDIT && !form.content.deletedAt
                ? 'SUBMIT CHANGES'
                : 'SUBMIT'}
            </ActionButton>
          )
          // for spacing issues only
          : (<div />)}
      </div>
    </Paper>
  );
};

export default RecordForm;
