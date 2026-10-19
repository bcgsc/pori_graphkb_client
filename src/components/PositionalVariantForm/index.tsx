import {
  CircularProgress, Paper, Stack, Typography,
} from '@mui/material';
import React, { useCallback, useMemo } from 'react';

import ActionButton from '@/components/ActionButton';
import { useAuth } from '@/components/Auth';
import DropDownSelect from '@/components/DropDownSelect';
import FormLayout from '@/components/FormLayout';
import useSchemaForm, { FormContext } from '@/components/hooks/useSchemaForm';
import RecordFormStateToggle from '@/components/RecordFormStateToggle';
import { FORM_VARIANT } from '@/components/util';
import { ErrorMessage } from '@/services/errors';
import schema from '@/services/schema';

import RecordAutocomplete from '../RecordAutocomplete';
import { GeneralRecordType } from '../types';
import BreakpointForm from './BreakpointForm';

const MODEL = schema.get('PositionalVariant');

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

  const initialValue = useMemo(() => ({ '@class': MODEL.name, ...value }), [value]);
  const form = useSchemaForm(MODEL, initialValue, { variant, onActionSuccess: onSubmit });
  const { update: updateForm } = form;

  const otherValidation = useMemo(() => {
    if (variant === FORM_VARIANT.VIEW) {
      return null;
    }
    const variantTypeName = (form.content as any)?.type?.displayName;
    const coordinateTypeClass = (form.content as any)?.break1Start?.['@class'] ?? 'GenomicPosition';

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
  }, [variant, form.content]);

  const formHasErrors = !form.validation.valid || Boolean(otherValidation);

  const handleUpdateVariantType = useCallback((value: unknown) => {
    updateForm({ type: value });
  }, [updateForm]);

  const coordinateType = form.content?.break1Start?.['@class'] || 'GenomicPosition';

  const handleUpdateCoordinateType = useCallback((newCoordinateType: string) => {
    const updates: Record<string, unknown> = {};

    ['break1Start', 'break1End', 'break2Start', 'break2End'].forEach((prop) => {
      if (form.content[prop]) {
        updates[`${prop}.@class`] = newCoordinateType;
      }
    });

    updateForm(updates);
  }, [updateForm, form.content]);

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
      <FormContext.Provider value={form}>
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
                requireConfirm={variant === FORM_VARIANT.EDIT && form.isDirty}
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
            error={Boolean((!(form.validation.properties?.type?.valid ?? true) && form.isDirty) || otherValidation?.type)}
            getQueryBody={() => ({
              target: 'Vocabulary',
              orderBy: ['displayName'],
              filters: [{ operator: 'IN', displayName: allowedTypes }],
            })}
            helperText={otherValidation?.type ?? form.validation.properties?.type?.message ?? form.model.properties.type.description}
            isMulti={false}
            label="type"
            name="type"
            onChange={(e) => handleUpdateVariantType(e.target.value)}
            readOnly={variant === FORM_VARIANT.VIEW}
            required
            singleLoad
            value={form.content.type ?? null}
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
            readOnly={variant === FORM_VARIANT.VIEW}
          />
          <BreakpointForm
            breakpoint="2"
            coordinateType={coordinateType}
            readOnly={variant === FORM_VARIANT.VIEW}
          />
        </Stack>
        <FormLayout
          collapseExtra
          disabled={form.action.inProgress || form.variant === FORM_VARIANT.VIEW}
          exclusions={FIELD_EXCLUSIONS}
          order={REMAINING_FIELD_ORDER}
        />
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
          {variant === FORM_VARIANT.NEW || (variant === FORM_VARIANT.EDIT)
            ? (
              <ActionButton
                color="primary"
                disabled={form.action.inProgress || (formHasErrors && form.isDirty)}
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
      </FormContext.Provider>
    </Paper>
  );
};

export default VariantForm;
