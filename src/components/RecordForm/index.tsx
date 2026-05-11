import './index.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import {
  CircularProgress,
  Paper, Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useCallback, useMemo } from 'react';
import { useMutation } from 'react-query';

import ActionButton from '@/components/ActionButton';
import FormContext from '@/components/FormContext';
import FormLayout from '@/components/FormLayout';
import useSchemaForm from '@/components/hooks/useSchemaForm';
import RecordFormStateToggle from '@/components/RecordFormStateToggle';
import { GeneralRecordType } from '@/components/types';
import { cleanPayload, FORM_VARIANT } from '@/components/util';
import api from '@/services/api';
import { ErrorMessage } from '@/services/errors';
import schema from '@/services/schema';

import { useAuth } from '../Auth';
import EdgeTable from './EdgeTable';
import RelatedStatementsTable from './RelatedStatementsTable';
import RelatedVariantsTable from './RelatedVariantsTable';

const FIELD_EXCLUSIONS = ['groupRestrictions'];

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
  variant?: FORM_VARIANT;
}

/**
 * Form/View that displays the contents of a single node
 */
const RecordForm = ({
  value: initialValue = {},
  modelName = '',
  title,
  onToggleState,
  onSubmit,
  variant = FORM_VARIANT.VIEW,
}: RecordFormProps) => {
  const snackbar = useSnackbar();
  const auth = useAuth();

  const fieldDefs = useMemo(() => (modelName ? schemaDefn.getProperties(modelName) : {}), [modelName]);
  const isEdge = useMemo(() => (modelName ? schema.isEdge(modelName) : false), [modelName]);

  const form = useSchemaForm(fieldDefs, initialValue, {}, { variant });
  const {
    formIsDirty, setFormIsDirty, formContent, formErrors, formHasErrors,
  } = form;

  const { mutate: addNewAction, isPending: isAdding, error: errorAdding } = useMutation({
    mutationFn: async (content: GeneralRecordType) => {
      const payload = cleanPayload(content);
      const { routeName } = schemaDefn.get(payload);
      return api.post(routeName, payload);
    },
    onSuccess: (result) => {
      snackbar.enqueueSnackbar(`Sucessfully created the record ${result['@rid']}`, { variant: 'success' });
      onSubmit?.(result);
    },
  });

  /**
   * Handler for submission of a new record
   */
  const handleNewAction = useCallback(async () => {
    if (formHasErrors) {
      // bring up the snackbar for errors
      console.error(formErrors);
      snackbar.enqueueSnackbar('There are errors in the form which must be resolved before it can be submitted', { variant: 'error' });
      setFormIsDirty(true);
    } else {
      // ok to POST
      const content = { ...formContent };

      if (!formContent['@class']) {
        content['@class'] = modelName;
      }

      addNewAction(content);
    }
  }, [addNewAction, formContent, formErrors, formHasErrors, modelName, setFormIsDirty, snackbar]);

  const { mutate: deleteAction, isPending: isDeleting, error: errorDeleting } = useMutation({
    mutationFn: async (content: GeneralRecordType) => {
      const { routeName } = schemaDefn.get(content);
      return api.delete(`${routeName}/${content['@rid']!.replace(/^#/, '')}`);
    },
    onSuccess: (_, content) => {
      snackbar.enqueueSnackbar(`Successfully deleted the record ${content['@rid']}`, { variant: 'success' });
      onSubmit?.();
    },
  });

  /**
   * Handler for deleting an existing record
   */
  const handleDeleteAction = useCallback(async () => {
    const content = { ...formContent };

    if (!formContent['@class']) {
      content['@class'] = modelName;
    }
    deleteAction(content);
  }, [deleteAction, formContent, modelName]);

  const { mutate: updateAction, isPending: isUpdating, error: errorUpdating } = useMutation({
    mutationFn: async (content: GeneralRecordType) => {
      const payload = cleanPayload(content);
      const { routeName } = schemaDefn.get(payload);
      return api.patch(`${routeName}/${content['@rid']!.replace(/^#/, '')}`, payload);
    },
    onSuccess: (result) => {
      snackbar.enqueueSnackbar(`Successfully edited the record ${result['@rid']}`, { variant: 'success' });
      onSubmit?.(result);
    },
  });

  /**
   * Handler for edits to an existing record
   */
  const handleEditAction = useCallback(async () => {
    const content = { ...formContent };

    if (!formContent['@class']) {
      content['@class'] = modelName;
    }

    if (formHasErrors) {
      // bring up the snackbar for errors
      console.error(formErrors);
      snackbar.enqueueSnackbar('There are errors in the form which must be resolved before it can be submitted', { variant: 'error' });
      setFormIsDirty(true);
    } else if (!formIsDirty) {
      snackbar.enqueueSnackbar('no changes to submit');
      onSubmit?.(formContent);
    } else {
      updateAction(content);
    }
  }, [formContent, formErrors, formHasErrors, formIsDirty, modelName, onSubmit, setFormIsDirty, snackbar, updateAction]);

  const actionInProgress = isAdding || isDeleting || isUpdating;

  let pageTitle = title;

  if (variant === FORM_VARIANT.VIEW && formContent) {
    if (formContent.displayName) {
      pageTitle = `${formContent.displayName} (${formContent['@rid']})`;
    } else {
      pageTitle = `${formContent['@class']} ${formContent['@rid']}`;
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
              allowEdit={auth.hasWriteAccess && !formContent.deletedAt}
              message="Are you sure? You will lose your changes."
              onClick={onToggleState}
              requireConfirm={variant === 'edit' && formIsDirty}
              value={variant}
            />
          )}
        </div>
      </div>
      <FormContext.Provider value={form}>
        <FormLayout
          collapseExtra
          disabled={actionInProgress || variant === FORM_VARIANT.VIEW || (variant === FORM_VARIANT.EDIT && isEdge)}
          exclusions={FIELD_EXCLUSIONS}
          modelName={modelName}
        />
      </FormContext.Provider>
      {modelName && variant === FORM_VARIANT.VIEW && schemaDefn.ancestors(modelName).includes('V') && (
        <>
          <EdgeTable recordId={String(form.formContent['@rid'])} />
          <RelatedStatementsTable recordId={String(form.formContent['@rid'])} />
          {schemaDefn.ancestors(modelName).includes('Ontology') && (
            <RelatedVariantsTable recordId={String(form.formContent['@rid'])} />
          )}
        </>
      )}
      <ErrorMessage error={errorAdding}>An error occurred while creating record.</ErrorMessage>
      <ErrorMessage error={errorDeleting}>An error occurred while deleting record.</ErrorMessage>
      <ErrorMessage error={errorUpdating}>An error occurred while updating record.</ErrorMessage>
      <div className="record-form__action-buttons">
        {variant === FORM_VARIANT.EDIT && !formContent.deletedAt
          ? (
            <ActionButton
              color="error"
              disabled={actionInProgress}
              message="Are you sure you want to delete this record?"
              onClick={handleDeleteAction}
              variant="outlined"
            >
              DELETE RECORD
            </ActionButton>
          )
          // for spacing issues only
          : (<div />)}
        {actionInProgress && (
        <CircularProgress size={50} />
        )}
        {variant === FORM_VARIANT.NEW || (variant === FORM_VARIANT.EDIT && !isEdge)
          ? (
            <ActionButton
              color="primary"
              disabled={actionInProgress || (formHasErrors && formIsDirty)}
              onClick={variant === FORM_VARIANT.EDIT
                ? handleEditAction
                : handleNewAction}
              requireConfirm={false}
              variant="contained"
            >
              {variant === FORM_VARIANT.EDIT && !formContent.deletedAt
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
