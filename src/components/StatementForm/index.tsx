import './index.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import {
  Button, CircularProgress,
  Paper, Typography,
} from '@material-ui/core';
import LocalLibraryIcon from '@material-ui/icons/LocalLibrary';
import { Alert } from '@material-ui/lab';
import { useSnackbar } from 'notistack';
import React, {
  useCallback, useEffect, useState,
} from 'react';
import { useMutation, useQuery } from 'react-query';

import ActionButton from '@/components/ActionButton';
import { useAuth } from '@/components/Auth';
import FormContext from '@/components/FormContext';
import FormLayout from '@/components/FormLayout';
import useSchemaForm from '@/components/hooks/useSchemaForm';
import RecordFormStateToggle from '@/components/RecordFormStateToggle';
import { GeneralRecordType } from '@/components/types';
import { cleanPayload, FORM_VARIANT, tuple } from '@/components/util';
import api from '@/services/api';

import CivicEvidenceLink from './CivicEvidenceLink';
import ReviewDialog from './ReviewDialog';

const FIELD_EXCLUSIONS = ['groupRestrictions'];

interface StatementFormProps {
  /** the title for this form */
  title: string;
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
const StatementForm = ({
  value: initialValue,
  title,
  onToggleState,
  onSubmit,
  onError,
  variant,
  ...rest
}: StatementFormProps) => {
  const { data: diagnosticData } = useQuery(
    tuple(
      '/query',
      {
        queryType: 'similarTo',
        target: {
          queryType: 'ancestors',
          target: 'Vocabulary',
          filters: { name: 'diagnostic indicator' },
        },
        returnProperties: ['name'],
      },
    ),
    async ({ queryKey: [, body] }) => api.query(body),
  );

  const { data: therapeuticData } = useQuery(
    tuple(
      '/query',
      {
        queryType: 'similarTo',
        target: {
          queryType: 'ancestors',
          target: 'Vocabulary',
          filters: { name: 'therapeutic efficacy' },
        },
        returnProperties: ['name'],
      },
    ),
    async ({ queryKey: [, body] }) => api.query(body),
  );

  const { data: prognosticData } = useQuery(
    tuple(
      '/query',
      {
        queryType: 'similarTo',
        target: {
          queryType: 'ancestors',
          target: 'Vocabulary',
          filters: { name: 'prognostic indicator' },
        },
        returnProperties: ['name'],
      },
    ),
    async ({ queryKey: [, body] }) => api.query(body),
  );

  const snackbar = useSnackbar();
  const auth = useAuth();
  const model = schemaDefn.schema.Statement;
  const fieldDefs = model.properties;

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [civicEvidenceId, setCivicEvidenceId] = useState('');

  const checkLogicalStatement = useCallback((formContent) => {
    try {
      const {
        relevance: { name: relevanceName },
        subject: { '@class': subjectClass, name: subjectName },
      } = formContent;

      if (relevanceName === 'eligibility') {
        if (subjectClass !== 'ClinicalTrial') {
          return 'eligibility statements should have a ClinicalTrial subject';
        }
      } else if (diagnosticData.some((r) => r.name === relevanceName)) {
        if (subjectClass !== 'Disease') {
          return 'diagnostic statements should have a Disease subject';
        }
      } else if (therapeuticData.some((r) => r.name === relevanceName)) {
        if (subjectClass !== 'Therapy') {
          return 'therapeutic statements should have a Therapy subject';
        }
      } else if (prognosticData.some((r) => r.name === relevanceName)) {
        if (subjectName !== 'patient') {
          return 'prognostic statements should have the Vocabulary record "patient" for the subject';
        }
      }
    } catch (err) {} // eslint-disable-line no-empty
    return '';
  }, [diagnosticData, prognosticData, therapeuticData]);

  const form = useSchemaForm(fieldDefs, initialValue, {
    variant,
    additionalValidationFn: checkLogicalStatement,
  });
  const {
    formIsDirty,
    setFormIsDirty,
    formContent,
    formErrors,
    updateField,
    formHasErrors,
    additionalValidationError,
  } = form;

  useEffect(() => {
    try {
      if (variant === FORM_VARIANT.VIEW && formContent.source.name === 'civic' && formContent.sourceId) {
        setCivicEvidenceId(formContent.sourceId);
      } else {
        setCivicEvidenceId('');
      }
    } catch (err) {
      setCivicEvidenceId('');
    }
  }, [variant, formContent]);

  const statementReviewCheck = useCallback((currContent, content) => {
    const updatedContent = { ...content };

    if (!currContent.reviewStatus) {
      updatedContent.reviewStatus = 'initial';
    }

    if (!currContent.reviews) {
      const createdBy = auth.user;
      updatedContent.reviews = [{
        status: 'initial',
        comment: '',
        createdBy,
      }];
    }

    return updatedContent;
  }, [auth]);

  const { mutate: addNewAction, isLoading: isAdding } = useMutation(
    async (content: Partial<GeneralRecordType>) => {
      const payload = cleanPayload(content);
      const { routeName } = schemaDefn.get(payload);
      return api.post(routeName, payload);
    },
    {
      onSuccess: (result) => {
        snackbar.enqueueSnackbar(`Sucessfully created the record ${result['@rid']}`, { variant: 'success' });
        onSubmit?.(result);
      },
      onError: (err: Error, content) => {
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
      let content = { ...formContent, '@class': model.name };
      content = statementReviewCheck(formContent, content);
      addNewAction(content);
    }
  }, [addNewAction, formContent, formErrors, formHasErrors, model.name, setFormIsDirty, snackbar, statementReviewCheck]);

  const { mutate: deleteAction, isLoading: isDeleting } = useMutation(
    async (content: GeneralRecordType) => {
      const { routeName } = schemaDefn.get(content);
      return api.delete(`${routeName}/${content['@rid'].replace(/^#/, '')}`);
    },
    {
      onSuccess: (_, content) => {
        snackbar.enqueueSnackbar(`Sucessfully deleted the record ${content['@rid']}`, { variant: 'success' });
        onSubmit?.();
      },
      onError: (err: Error, content) => {
        snackbar.enqueueSnackbar(`Error (${err.name}) in deleting the record (${content['@rid']})`, { variant: 'error' });
        onError?.({ error: err, content });
      },
    },
  );

  /**
   * Handler for deleting an existing record
   */
  const handleDeleteAction = useCallback(async () => {
    const content = { ...formContent, '@class': model.name };
    deleteAction(content);
  }, [deleteAction, formContent, model.name]);

  const { mutate: updateAction, isLoading: isUpdating } = useMutation(
    async (content: GeneralRecordType) => {
      const payload = cleanPayload(content);
      const { routeName } = schemaDefn.get(payload);
      return api.patch(`${routeName}/${content['@rid'].replace(/^#/, '')}`, payload);
    },
    {
      onSuccess: (result) => {
        snackbar.enqueueSnackbar(`Sucessfully edited the record ${result['@rid']}`, { variant: 'success' });
        onSubmit?.(result);
      },
      onError: (err: Error, content) => {
        snackbar.enqueueSnackbar(`Error (${err.name}) in editing the record (${content['@rid']})`, { variant: 'error' });
        onError?.({ error: err, content });
      },
    },
  );

  /**
   * Handler for edits to an existing record
   */
  const handleEditAction = useCallback(async () => {
    const content = { ...formContent, '@class': model.name };

    if (formHasErrors) {
      // bring up the snackbar for errors
      console.error(formErrors);
      snackbar.enqueueSnackbar('There are errors in the form which must be resolved before it can be submitted', { variant: 'error' });
      setFormIsDirty(true);
    } else if (!formIsDirty) {
      snackbar.enqueueSnackbar('no changes to submit');
      onSubmit(formContent);
    } else {
      updateAction(content);
    }
  }, [formContent, formErrors, formHasErrors, formIsDirty, model.name, onSubmit, setFormIsDirty, snackbar, updateAction]);

  const actionInProgress = isAdding || isDeleting || isUpdating;

  const handleAddReview = useCallback((content, updateReviewStatus) => {
    // add the new value to the field
    const reviews = [...(formContent.reviews || []), content];
    updateField('reviews', reviews);

    if (updateReviewStatus) {
      updateField('reviewStatus', content.status);
    }
    setReviewDialogOpen(false);
    setFormIsDirty(true);
  }, [formContent.reviews, setFormIsDirty, updateField]);

  let pageTitle = title;

  if (variant === FORM_VARIANT.VIEW && formContent) {
    if (formContent.displayName) {
      pageTitle = `${formContent.displayName} (${formContent['@rid']})`;
    } else {
      pageTitle = `${formContent['@class']} ${formContent['@rid']}`;
    }
  }

  return (
    <Paper className="statement-form__wrapper" elevation={4}>
      <div className="statement-form__header">
        <span className="title">
          <Typography variant="h1">{pageTitle}</Typography>
          {title !== pageTitle && (<Typography variant="subtitle">{title}</Typography>)}
        </span>
        <div className={`header__actions header__actions--${variant}`}>
          {variant === FORM_VARIANT.EDIT && (
            <Button
              className="header__review-action"
              disabled={actionInProgress}
              onClick={() => setReviewDialogOpen(true)}
              variant="outlined"
            >
              <LocalLibraryIcon classes={{ root: 'review-icon' }} />
              Add Review
            </Button>
          )}
          {civicEvidenceId && <CivicEvidenceLink evidenceId={civicEvidenceId} />}
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
        {variant === FORM_VARIANT.EDIT && (
          <ReviewDialog
            isOpen={reviewDialogOpen}
            onClose={() => setReviewDialogOpen(false)}
            onSubmit={handleAddReview}
          />
        )}
      </div>

      <FormContext.Provider value={form}>
        <FormLayout
          {...rest}
          collapseExtra
          disabled={actionInProgress || variant === FORM_VARIANT.VIEW}
          exclusions={FIELD_EXCLUSIONS}
          modelName={model.name}
          variant={variant}
        />
      </FormContext.Provider>
      <div className="statement-form__action-buttons">
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
        {additionalValidationError && (
          <Alert severity="error">{additionalValidationError}</Alert>
        )}
        {variant === FORM_VARIANT.NEW || variant === FORM_VARIANT.EDIT
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

StatementForm.defaultProps = {
  onError: () => {},
  onSubmit: () => {},
  onToggleState: undefined,
  rid: null,
  variant: FORM_VARIANT.VIEW,
  value: {},
};

export default StatementForm;
