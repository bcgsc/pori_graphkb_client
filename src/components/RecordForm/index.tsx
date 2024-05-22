import './index.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import {
  CircularProgress,
  Paper, Typography,
} from '@material-ui/core';
import { useSnackbar } from 'notistack';
import React, {
  useCallback, useEffect, useState,
} from 'react';
import { useMutation } from 'react-query';

import ActionButton from '@/components/ActionButton';
import FormContext from '@/components/FormContext';
import FormLayout from '@/components/FormLayout';
import useSchemaForm from '@/components/hooks/useSchemaForm';
import RecordFormStateToggle from '@/components/RecordFormStateToggle';
import { GeneralRecordType } from '@/components/types';
import { cleanPayload, FORM_VARIANT } from '@/components/util';
import api from '@/services/api';
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
  onError?: (arg: { error: unknown; content: unknown }) => void;
  onSubmit?: (record?: GeneralRecordType) => void;
  onToggleState?: (newState: FORM_VARIANT | 'graph') => void;
  /** the record id of the current record for the form */
  rid?: string;
  /** values of individual properties of passed class model */
  value?: GeneralRecordType;
  /** the type of NodeForm to create */
  variant?: FORM_VARIANT;
}

/**
 * Form/View that displays the contents of a single node
 */
const RecordForm = ({
  value: initialValue,
  modelName,
  title,
  onToggleState,
  onSubmit,
  onError,
  variant,
  ...rest
}: RecordFormProps) => {
  const snackbar = useSnackbar();
  const auth = useAuth();

  const [isEdge, setIsEdge] = useState(false);

  const [fieldDefs, setFieldDefs] = useState({});

  useEffect(() => {
    if (modelName) {
      const properties = schemaDefn.getProperties(modelName);
      setFieldDefs(properties);
      setIsEdge(schema.isEdge(modelName));
    }
  }, [modelName]);

  const form = useSchemaForm(fieldDefs, initialValue, { variant });
  const {
    formIsDirty, setFormIsDirty, formContent, formErrors, formHasErrors,
  } = form;

  const { mutate: addNewAction, isLoading: isAdding } = useMutation(
    async (content) => {
      const payload = cleanPayload(content);
      const { routeName } = schemaDefn.get(payload);
      return api.post(routeName, payload);
    },
    {
      onSuccess: (result) => {
        snackbar.enqueueSnackbar(`Sucessfully created the record ${result['@rid']}`, { variant: 'success' });
        onSubmit?.(result);
      },
      onError: (err, content) => {
        console.error(err);
        snackbar.enqueueSnackbar(`Error (${err.name}) in creating the record`, { variant: 'error' });
        onError?.({ error: err, content });
      },
    },
  );

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

  const { mutate: deleteAction, isLoading: isDeleting } = useMutation(
    async (content) => {
      const { routeName } = schemaDefn.get(content);
      return api.delete(`${routeName}/${content['@rid'].replace(/^#/, '')}`);
    },
    {
      onSuccess: (_, content) => {
        snackbar.enqueueSnackbar(`Successfully deleted the record ${content['@rid']}`, { variant: 'success' });
        onSubmit?.();
      },
      onError: (err, content) => {
        snackbar.enqueueSnackbar(`Error (${err.name}) in deleting the record (${content['@rid']})`, { variant: 'error' });
        onError?.({ error: err, content });
      },
    },
  );

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

  const { mutate: updateAction, isLoading: isUpdating } = useMutation(
    async (content) => {
      const payload = cleanPayload(content);
      const { routeName } = schemaDefn.get(payload);
      return api.patch(`${routeName}/${content['@rid'].replace(/^#/, '')}`, payload);
    },
    {
      onSuccess: (result) => {
        snackbar.enqueueSnackbar(`Successfully edited the record ${result['@rid']}`, { variant: 'success' });
        onSubmit?.(result);
      },
      onError: (err, content) => {
        snackbar.enqueueSnackbar(`Error (${err.name}) in editing the record (${content['@rid']})`, { variant: 'error' });
        onError?.({ error: err, content });
      },
    },
  );

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
              allowEdit={auth.hasWriteAccess}
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
          {...rest}
          collapseExtra
          disabled={actionInProgress || variant === FORM_VARIANT.VIEW || (variant === FORM_VARIANT.EDIT && isEdge)}
          exclusions={FIELD_EXCLUSIONS}
          modelName={modelName}
          variant={variant}
        />
      </FormContext.Provider>
      {variant === FORM_VARIANT.VIEW && schemaDefn.ancestors(modelName).includes('V') && (
        <>
          <EdgeTable recordId={String(form.formContent['@rid'])} />
          <RelatedStatementsTable recordId={String(form.formContent['@rid'])} />
          {schemaDefn.ancestors(modelName).includes('Ontology') && (
            <RelatedVariantsTable recordId={String(form.formContent['@rid'])} />
          )}
        </>
      )}
      <div className="record-form__action-buttons">
        {variant === FORM_VARIANT.EDIT
          ? (
            <ActionButton
              disabled={actionInProgress}
              message="Are you sure you want to delete this record?"
              onClick={handleDeleteAction}
              size="large"
              variant="outlined"
            >
              DELETE
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
              size="large"
              variant="contained"
            >
              {variant === FORM_VARIANT.EDIT
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

RecordForm.defaultProps = {
  modelName: '',
  onError: () => {},
  onSubmit: () => {},
  onToggleState: undefined,
  rid: null,
  variant: FORM_VARIANT.VIEW,
  value: {},
};

export default RecordForm;
