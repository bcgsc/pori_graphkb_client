import './index.scss';

import FileCopyIcon from '@mui/icons-material/FileCopy';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import { Button, Paper } from '@mui/material';
import { isEmpty } from 'lodash';
import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { useQuery } from 'react-query';
import { Link, useNavigate, useParams } from 'react-router';

import FormLayout from '@/components/FormLayout';
import useSchemaForm, { FormContext } from '@/components/hooks/useSchemaForm';
import { GeneralRecordType } from '@/components/types';
import { FORM_VARIANT, tuple } from '@/components/util';
import api from '@/services/api';
import schema from '@/services/schema';

import { FormActions, FormErrors, FormHeader } from '../RecordForm';
import StatementSentence from '../SentencePreview/StatementSentence';
import CivicEvidenceLink from './CivicEvidenceLink';
import ReviewDialog from './ReviewDialog';

const model = schema.get('Statement');

interface StatementFormProps {
  /** the title for this form */
  title: string;
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
const StatementForm = ({
  value: initialValue,
  title,
  onToggleState,
  onSubmit,
  variant = FORM_VARIANT.VIEW,
}: StatementFormProps) => {
  const params = useParams();
  const navigate = useNavigate();

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

  // Fetch and populate the fields for quick copy of record
  const statementQuery = useQuery({
    queryKey: [`/statements/${params.rid}?neighbors=1`],
    queryFn: async ({ queryKey: [route] }) => api.get(route),
    enabled: (isEmpty(initialValue) && Boolean(params.rid)),
    throwOnError: true,
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

  useEffect(() => {
    if (statementQuery.data) {
      navigate('/new/statement', { replace: true });
      const keysToIgnore = [
        '@rid', '@class',
        'createdAt', 'createdBy',
        'updatedAt', 'updatedBy',
        'deletedAt', 'deletedBy',
        'uuid', 'reviews',
      ];
      Object.entries(statementQuery.data).forEach(([key, value]) => {
        if (!keysToIgnore.includes(key)) {
          updateField(key, value);
        }
      });
    }
  }, [navigate, statementQuery.data, updateField]);

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
    <FormContext.Provider value={form}>
      <Paper className="record-form__wrapper" elevation={4}>
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
        <StatementSentence
          content={form.content}
        />
        <FormLayout
          collapseExtra
        />
        <FormErrors />
        <FormActions />
      </Paper>
    </FormContext.Provider>
  );
};

export default StatementForm;
