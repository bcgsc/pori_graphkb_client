import {
  CircularProgress, Paper, Stack, Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useMutation, useQueryClient } from 'react-query';

import ActionButton from '@/components/ActionButton';
import { useAuth } from '@/components/Auth';
import DropDownSelect from '@/components/DropDownSelect';
import FormContext from '@/components/FormContext';
import FormLayout from '@/components/FormLayout';
import useSchemaForm from '@/components/hooks/useSchemaForm';
import RecordFormStateToggle from '@/components/RecordFormStateToggle';
import { cleanPayload, FORM_VARIANT } from '@/components/util';
import api from '@/services/api';
import { ErrorMessage } from '@/services/errors';
import schema from '@/services/schema';

import { GeneralRecordType } from '../types';
import BreakpointForm from './BreakpointForm';

const PositionalVariant = schema.get('PositionalVariant');

const FIELD_EXCLUSIONS = [
  'groupRestrictions',
  // explicitly since we add them above
  'break1Start',
  'break1End',
  'break2Start',
  'break2End',
  'reference1',
  'reference2',
];

const coordinateOptions = schema.descendants('Position', { excludeAbstract: true, includeSelf: true }).map((m) => ({
  label: m, value: m, key: m, caption: schema.get(m).description,
}));

const MAJOR_FORM_TYPES = {
  SUB: 'Substitution',
  INDEL: 'Indel',
  TRANS_WITH_POS: 'Multi-Reference (ex. Translocation)',
  OTHER_WITH_POS: 'Other Variant',
};

const pickInputType = (record) => {
  if (record.reference2) {
    return MAJOR_FORM_TYPES.TRANS_WITH_POS;
  } if (record.type && record.type.name) {
    if (record.type.name === 'substitution') {
      return MAJOR_FORM_TYPES.SUB;
    }
  }
  return MAJOR_FORM_TYPES.OTHER_WITH_POS;
};

interface VariantFormProps {
  /** the title for this form */
  title: string;
  onSubmit?: (record?: GeneralRecordType) => void;
  onToggleState?: (newState: FORM_VARIANT | 'graph') => void;
  /** values of individual properties of passed class model */
  value?: GeneralRecordType;
  /** the type of NodeForm to create */
  variant?: FORM_VARIANT.EDIT | FORM_VARIANT.NEW | FORM_VARIANT.VIEW;
}

/**
 * Input form for new Variants
 */
const VariantForm = ({
  title, onSubmit, onToggleState, value, variant = FORM_VARIANT.NEW,
}: VariantFormProps) => {
  const auth = useAuth();
  let defaultCoordinateType;

  if (value?.break1Start) {
    defaultCoordinateType = value.break1Start['@class'];
  }
  const [coordinateType, setCoordinateType] = useState(defaultCoordinateType || 'GenomicPosition');

  const [inputType, setInputType] = useState(
    variant === FORM_VARIANT.NEW
      ? MAJOR_FORM_TYPES.SUB
      : pickInputType(value),
  );
  const snackbar = useSnackbar();

  useEffect(() => {
    if (variant !== FORM_VARIANT.NEW && value) {
      setInputType(pickInputType(value));

      if (value?.break1Start) {
        setCoordinateType(value.break1Start['@class']);
      }
    }
  }, [value, variant]);

  const isSubstitution = inputType === MAJOR_FORM_TYPES.SUB;
  const isFusion = inputType === MAJOR_FORM_TYPES.TRANS_WITH_POS;
  const queryClient = useQueryClient();

  const model = useMemo(() => ({
    name: PositionalVariant.name,
    properties: {
      ...PositionalVariant.properties,
      break2Start: { ...PositionalVariant.properties.break2Start, mandatory: !isSubstitution },
      reference2: { ...PositionalVariant.properties.reference2, mandatory: isFusion },
      refSeq: { ...PositionalVariant.properties.refSeq, mandatory: isSubstitution },
      untemplatedSeq: {
        ...PositionalVariant.properties.untemplatedSeq,
        mandatory: isSubstitution,
      },
    },
  }), [isSubstitution, isFusion]);

  const initialValue = useMemo(() => ({ '@class': model.name, ...value }), [model.name, value]);
  const form = useSchemaForm(model, initialValue, { variant });
  const {
    formContent, formErrors, formHasErrors, formIsDirty,
  } = form;

  /**
   * Mutation for submitting (creating or updating) a variant record
   */
  const submitMutation = useMutation({
    mutationFn: async (content: GeneralRecordType) => {
      const payload = cleanPayload(content);

      /* KBDEV-1216 Adding refAA to break1Start property when new variant has ProteinPosition coordinate system.
      Property has the same value as refSeq and should be hidden from users to avoid confusion. */
      if (payload?.break1Start && payload?.break1Start['@class'] === 'ProteinPosition') {
        const refAA = payload.refSeq ? payload.refSeq : '';
        payload.break1Start = { ...payload.break1Start, refAA };
      }

      const { routeName } = schema.get(payload);

      if (variant === FORM_VARIANT.NEW) {
        return api.post(routeName, payload);
      }
      const { displayName: _, ...rest } = payload;
      return api.patch(`${routeName}/${content['@rid']!.replace(/^#/, '')}`, rest);
    },
    onSuccess: (result) => {
      const actionType = variant === FORM_VARIANT.NEW ? 'created' : 'edited';

      if (result['@rid']) {
        const { routeName } = schema.get(result);
        const cleanRid = result['@rid'].replace(/^#/, '');

        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryString = String(query.queryKey[0]);
            return queryString.includes(routeName) && queryString.includes(cleanRid);
          },
        });

        queryClient.refetchQueries({
          predicate: (query) => {
            const queryString = String(query.queryKey[0]);
            return queryString.includes(routeName) && queryString.includes(cleanRid);
          },
        });
      }

      snackbar.enqueueSnackbar(`Sucessfully ${actionType} the record ${result['@rid']}`, { variant: 'success' });
      onSubmit?.(result);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (content: GeneralRecordType) => {
      const payload = cleanPayload(content);
      const { routeName } = schema.get(payload);
      return api.delete(`${routeName}/${content['@rid']!.replace(/^#/, '')}`);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries();
      snackbar.enqueueSnackbar(`Sucessfully deleted the record ${result['@rid']}`, { variant: 'success' });
      onSubmit?.();
    },
  });

  const handleSubmitAction = useCallback(() => {
    if (formHasErrors) {
      // bring up the snackbar for errors
      console.error(formErrors);
      snackbar.enqueueSnackbar('There are errors in the form which must be resolved before it can be submitted', { variant: 'error' });
    } else {
      // ok to submit
      submitMutation.mutate(formContent);
    }
  }, [formHasErrors, formErrors, snackbar, submitMutation, formContent]);

  const handleDeleteAction = useCallback(() => {
    deleteMutation.mutate(formContent);
  }, [deleteMutation, formContent]);

  const actionInProgress = submitMutation.isPending || deleteMutation.isPending;

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
      <FormContext.Provider value={form}>
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
                requireConfirm={variant === FORM_VARIANT.EDIT && formIsDirty}
                value={variant}
              />
            )}
          </div>
        </div>
        <Stack
          className="new-variant"
          spacing={2}
        >
          <DropDownSelect
            label="Pick the Input Type"
            onChange={({ target: { value: newValue } }) => setInputType(newValue)}
            options={Object.values(MAJOR_FORM_TYPES)}
            required
            value={inputType}
          />
          <DropDownSelect
            label="Pick the Position Coordinate System"
            onChange={({ target: { value: newValue } }) => setCoordinateType(newValue)}
            options={coordinateOptions}
            required
            value={coordinateType}
          />
          <BreakpointForm
            coordinateType={coordinateType}
            end="break1End"
            label={`Input the ${(isFusion || !isSubstitution) ? 'First ' : ''}Breakpoint`}
            model={model}
            reference="reference1"
            start="break1Start"
          />
          {(!isSubstitution && isFusion) && (
            <BreakpointForm
              coordinateType={coordinateType}
              end="break2End"
              label="Input the Second Breakpoint"
              model={model}
              reference="reference2"
              start="break2Start"
            />
          )}
        </Stack>
        <FormLayout
          collapseExtra
          disabled={actionInProgress || form.formVariant === FORM_VARIANT.VIEW}
          exclusions={FIELD_EXCLUSIONS}
        />
        <ErrorMessage error={submitMutation.error}>An error occurred while creating/editing record.</ErrorMessage>
        <ErrorMessage error={deleteMutation.error}>An error occurred while deleting record.</ErrorMessage>
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
          {variant === FORM_VARIANT.NEW || (variant === FORM_VARIANT.EDIT)
            ? (
              <ActionButton
                color="primary"
                disabled={actionInProgress || (formHasErrors && formIsDirty)}
                onClick={handleSubmitAction}
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
      </FormContext.Provider>
    </Paper>
  );
};

export default VariantForm;
