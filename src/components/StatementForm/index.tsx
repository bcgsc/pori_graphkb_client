import './index.scss';

import FileCopyIcon from '@mui/icons-material/FileCopy';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import { Button } from '@mui/material';
import { isEmpty } from 'lodash';
import React, {
  useCallback, useMemo, useState,
} from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router';

import FormLayout from '@/components/FormLayout';
import useSchemaForm from '@/components/hooks/useSchemaForm';
import { FORM_VARIANT, tuple } from '@/components/util';
import api from '@/services/api';
import schema from '@/services/schema';

import {
  Form, FormActions, FormContent, FormErrors, FormHeader, RecordFormProps,
} from '../RecordForm/DefaultRecordForm';
import StatementSentence from '../SentencePreview/StatementSentence';
import CivicEvidenceLink from './CivicEvidenceLink';
import ReviewDialog from './ReviewDialog';

const model = schema.get('Statement');

/**
 * Form/View that displays the contents of a single node
 */
const StatementForm = (props: RecordFormProps) => {
  const {
    value: initialValue,
    title,
    onToggleState,
    onSubmit,
    variant = FORM_VARIANT.VIEW,
    open = false,
    onClose,
    formType = 'inline',
  } = props;
  const { data: diagnosticData } = useQuery({
    queryKey: tuple(
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
    queryFn: async ({ queryKey: [, body] }) => api.query(body),
  });

  const { data: therapeuticData } = useQuery({
    queryKey: tuple(
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
    queryFn: async ({ queryKey: [, body] }) => api.query(body),
  });

  const { data: prognosticData } = useQuery({
    queryKey: tuple(
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
    queryFn: async ({ queryKey: [, body] }) => api.query(body),
  });

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

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
      } else if (diagnosticData?.some((r) => r.name === relevanceName)) {
        if (subjectClass !== 'Disease') {
          return 'diagnostic statements should have a Disease subject';
        }
      } else if (therapeuticData?.some((r) => r.name === relevanceName)) {
        if (subjectClass !== 'Therapy') {
          return 'therapeutic statements should have a Therapy subject';
        }
      } else if (prognosticData?.some((r) => r.name === relevanceName)) {
        if (subjectName !== 'patient') {
          return 'prognostic statements should have the Vocabulary record "patient" for the subject';
        }
      }
    } catch (err) {} // eslint-disable-line no-empty
    return '';
  }, [diagnosticData, prognosticData, therapeuticData]);

  const form = useSchemaForm(model, initialValue, {
    variant,
    additionalValidationFn: checkLogicalStatement,
    onActionSuccess: onSubmit,
  });
  const {
    setDirty: setFormIsDirty,
    updateField,
  } = form;

  const civicEvidenceId = useMemo(() => {
    try {
      if (variant === FORM_VARIANT.VIEW && form.content.source?.name === 'civic' && form.content.sourceId) {
        return form.content.sourceId;
      }
    } catch (err) {
      // pass
    }
    return '';
  }, [variant, form.content]);

  const handleAddReview = useCallback((content, updateReviewStatus) => {
    // add the new value to the field
    const reviews = [...(form.content.reviews || []), content];
    updateField('reviews', reviews);

    if (updateReviewStatus) {
      updateField('reviewStatus', content.status);
    }
    setReviewDialogOpen(false);
    setFormIsDirty(true);
  }, [form.content.reviews, setFormIsDirty, updateField]);

  return (
    <Form formType={formType} onClose={onClose} open={open} value={form}>
      <FormHeader
        actions={(
          <>
            {variant === FORM_VARIANT.EDIT && (
              <Button
                className="header__review-action"
                disabled={form.action.inProgress}
                onClick={() => setReviewDialogOpen(true)}
                variant="outlined"
              >
                <LocalLibraryIcon classes={{ root: 'review-icon' }} />
                Add Review
              </Button>
            )}
            {variant === FORM_VARIANT.VIEW && (
              <Button
                className="header__review-action"
                component={Link}
                target="_blank"
                to={!isEmpty(initialValue) ? `/new/${initialValue!['@class']!.toLowerCase()}/${initialValue!['@rid']!.replace(/^#/, '')}/` : ''}
                variant="outlined"
              >
                <FileCopyIcon classes={{ root: 'review-icon' }} /> Create As Copy
              </Button>
            )}
            {civicEvidenceId && <CivicEvidenceLink evidenceId={civicEvidenceId} />}
          </>
        )}
        onToggleState={onToggleState}
        title={title}
      />
      {variant === FORM_VARIANT.EDIT && (
        <ReviewDialog
          isOpen={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          onSubmit={handleAddReview}
        />
      )}
      <FormContent>
        <StatementSentence
          content={form.content}
        />
        <FormLayout
          collapseExtra
        />
      </FormContent>
      <FormErrors />
      <FormActions />
    </Form>
  );
};

export default StatementForm;
