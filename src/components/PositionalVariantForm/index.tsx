import {
  CircularProgress, Paper, Stack, Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useMutation, useQueryClient } from 'react-query';

import ActionButton from '@/components/ActionButton';
import { useAuth } from '@/components/Auth';
import DropDownSelect from '@/components/DropDownSelect';
import FormLayout from '@/components/FormLayout';
import useSchemaForm, { FormContext } from '@/components/hooks/useSchemaForm';
import RecordFormStateToggle from '@/components/RecordFormStateToggle';
import { cleanPayload, FORM_VARIANT } from '@/components/util';
import api from '@/services/api';
import { ErrorMessage } from '@/services/errors';
import schema from '@/services/schema';

import RecordAutocomplete from '../RecordAutocomplete';
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
  'type',
];

const REMAINING_FIELD_ORDER = [
  ['refSeq', 'untemplatedSeq', 'truncation', 'untemplatedSeqSize'],
];

const coordinateOptions = schema.descendants('Position', { excludeAbstract: true, includeSelf: true }).map((m) => ({
  label: m, value: m, key: m, caption: schema.get(m).description,
}));

const typeToAllowedCoordinates = {
  frameshift: ['ProteinPosition'],
  fusion: ['CdsLikePosition', 'ExonicPosition', 'GenomicPosition'],
  inversion: ['CdsLikePosition', 'GenomicPosition'],
  deletion: ['CdsLikePosition', 'ExonicPosition', 'GenomicPosition', 'ProteinPosition'],
  duplication: ['CdsLikePosition', 'GenomicPosition', 'ProteinPosition'],
  insertion: ['CdsLikePosition', 'GenomicPosition', 'ProteinPosition'],
  indel: ['CdsLikePosition', 'GenomicPosition', 'ProteinPosition'],
  'missense mutation': ['ProteinPosition'],
  'nonsense mutation': ['ProteinPosition'],
  substitution: ['CdsLikePosition', 'GenomicPosition', 'ProteinPosition'],
  acetylation: ['ProteinPosition'],
  methylation: ['ProteinPosition'],
  phosphorylation: ['ProteinPosition'],
  ubiquitination: ['ProteinPosition'],
};

const allowedTypes = Object.keys(typeToAllowedCoordinates).sort();

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
  title, onSubmit, onToggleState, value: valueProp, variant = FORM_VARIANT.NEW,
}: VariantFormProps) => {
  const auth = useAuth();
  const value = useMemo(() => ({
    ...valueProp ?? {},
    break1Start: valueProp?.break1Start ?? { '@class': 'GenomicPosition' },
  }), [valueProp]);

  const snackbar = useSnackbar();

  const [variantType, setVariantType] = useState((value?.type as any)?.displayName ?? 'substitution');

  const isSubstitution = ['substitution', 'missense mutation', 'nonsense mutation'].includes(variantType);
  const isFusion = ['fusion'].includes(variantType);
  const queryClient = useQueryClient();

  const model = useMemo(() => ({
    name: PositionalVariant.name,
    properties: {
      ...PositionalVariant.properties,
      break1Start: { ...PositionalVariant.properties.break1Start, description: '' },
      break2Start: { ...PositionalVariant.properties.break2Start, mandatory: !isSubstitution, description: '' },
      break1End: { ...PositionalVariant.properties.break1End, description: 'end of the breakpoint range' },
      break2End: { ...PositionalVariant.properties.break2End, description: 'end of the breakpoint range' },
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
    formContent, formErrors, formIsDirty, update: updateForm,
  } = form;

  const otherValidation = useMemo(() => {
    if (variant === FORM_VARIANT.VIEW) {
      return null;
    }
    const variantTypeName = (formContent as any)?.type?.displayName;
    const coordinateTypeClass = (formContent as any)?.break1Start?.['@class'] ?? 'GenomicPosition';

    if (variantTypeName) {
      if (!allowedTypes.includes(variantTypeName)) {
        return { type: `Type ${variantTypeName} is invalid. Only the following types are allowed to be created/modified in the interface: ${allowedTypes.join(', ')}.` };
      } if (!typeToAllowedCoordinates[variantTypeName].includes(coordinateTypeClass)) {
        return {
          coordinateType: `Coordinate System ${coordinateTypeClass} is not compatible with the selected type ${variantTypeName}. Only the following coordinate systems are allowed for this type: ${typeToAllowedCoordinates[variantTypeName].join(', ')}.`,
        };
      }
    }
    return null;
  }, [variant, formContent]);

  const formHasErrors = form.formHasErrors || Boolean(otherValidation);

  const handleUpdateVariantType = useCallback((value: unknown) => {
    setVariantType((value as any)?.displayName ?? null);
    updateForm({ type: value });
  }, [updateForm]);

  const coordinateType = formContent?.break1Start?.['@class'] || 'GenomicPosition';

  const handleUpdateCoordinateType = useCallback((newCoordinateType: string) => {
    const updates: Record<string, unknown> = {};

    ['break1Start', 'break1End', 'break2Start', 'break2End'].forEach((prop) => {
      if (formContent[prop]) {
        updates[`${prop}.@class`] = newCoordinateType;
      }
    });

    updateForm(updates);
  }, [updateForm, formContent]);

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
          <RecordAutocomplete
            error={Boolean((form.formErrors.type && form.formIsDirty) || otherValidation?.type)}
            getQueryBody={() => ({
              target: 'Vocabulary',
              orderBy: ['displayName'],
              filters: [{ operator: 'IN', displayName: allowedTypes }],
            })}
            helperText={otherValidation?.type ?? form.formErrors.type?.message ?? form.model.properties.type.description}
            isMulti={false}
            label="type"
            name="type"
            onChange={(e) => handleUpdateVariantType(e.target.value)}
            readOnly={variant === FORM_VARIANT.VIEW}
            required
            singleLoad
            value={formContent.type ?? null}
          />
          <DropDownSelect
            error={Boolean(otherValidation?.coordinateType)}
            helperText={otherValidation?.coordinateType}
            label="Position Coordinate System"
            onChange={({ target: { value: newValue } }) => handleUpdateCoordinateType(newValue)}
            options={coordinateOptions}
            readOnly={variant === FORM_VARIANT.VIEW}
            required
            value={coordinateType}
          />
          <BreakpointForm
            breakpoint="1"
            coordinateType={coordinateType}
            label={`${!isSubstitution ? 'First ' : ''}Breakpoint`}
            readOnly={variant === FORM_VARIANT.VIEW}
          />
          {!isSubstitution && (
            <BreakpointForm
              breakpoint="2"
              coordinateType={coordinateType}
              label="Second Breakpoint"
              readOnly={variant === FORM_VARIANT.VIEW}
            />
          )}
        </Stack>
        <FormLayout
          collapseExtra
          disabled={actionInProgress || form.formVariant === FORM_VARIANT.VIEW}
          exclusions={FIELD_EXCLUSIONS}
          order={REMAINING_FIELD_ORDER}
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
