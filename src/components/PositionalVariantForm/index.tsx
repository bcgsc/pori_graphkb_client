import {
  Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, TextField, Typography,
} from '@mui/material';
import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router';

import ActionButton from '@/components/ActionButton';
import { useAuth } from '@/components/Auth';
import DropDownSelect from '@/components/DropDownSelect';
import FormLayout, { LayoutItem } from '@/components/FormLayout';
import useSchemaForm, { FormContext } from '@/components/hooks/useSchemaForm';
import RecordFormStateToggle from '@/components/RecordFormStateToggle';
import { FORM_VARIANT, tuple } from '@/components/util';
import api from '@/services/api';
import { ErrorMessage } from '@/services/errors';
import schema from '@/services/schema';

import RecordAutocomplete from '../RecordAutocomplete';
import EdgeTable from '../RecordForm/EdgeTable';
import RelatedStatementsTable from '../RecordForm/RelatedStatementsTable';
import { GeneralRecordType } from '../types';
import BreakpointsForm from './BreakpointForm';

const MODEL = schema.get('PositionalVariant');

const FIELD_EXCLUSIONS = [
  // explicitly since we add them above
  'break1Repr',
  'break1Start',
  'break1End',
  'break2Repr',
  'break2Start',
  'break2End',
  'reference1',
  'reference2',
  'type',
];

const coordinateOptions = schema.descendants('Position', { excludeAbstract: true, includeSelf: true }).map((m) => ({
  label: m, value: m, key: m, caption: schema.get(m).description,
}));

const typeToAllowedCoordinates = {
  frameshift: ['ProteinPosition'],
  fusion: ['CdsPosition', 'ExonicPosition', 'GenomicPosition'],
  inversion: ['CdsPosition', 'GenomicPosition'],
  deletion: ['CdsPosition', 'ExonicPosition', 'GenomicPosition', 'ProteinPosition'],
  duplication: ['CdsPosition', 'GenomicPosition', 'ProteinPosition'],
  insertion: ['CdsPosition', 'GenomicPosition', 'ProteinPosition'],
  indel: ['CdsPosition', 'GenomicPosition', 'ProteinPosition'],
  'missense mutation': ['ProteinPosition'],
  'nonsense mutation': ['ProteinPosition'],
  substitution: ['CdsPosition', 'GenomicPosition', 'ProteinPosition'],
  acetylation: ['ProteinPosition'],
  methylation: ['ProteinPosition'],
  phosphorylation: ['ProteinPosition'],
  ubiquitination: ['ProteinPosition'],
};

interface PrepopulateVariantButtonProps {
  onSubmit: (content: Record<string, unknown>) => void;
}

/**
 * Lets users paste positional variant notation
 * (ex. KRAS:p.G12D) and prepopulates the variant form fields
 * based on the notation
 */
const PrepopulateVariantButton = ({ onSubmit }: PrepopulateVariantButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [prepopulateRequested, setPrepopulateRequested] = useState(false);

  const query = useQuery({
    queryKey: ['/upload/hgvs', inputValue],
    queryFn: async ({ client }) => {
      const result = await api.post('/upload/hgvs', { notation: inputValue, upload: false });
      const rids = ['reference1', 'reference2', 'type'].map((key) => result[key]).filter(Boolean);

      // get records instead of just rids
      if (rids.length) {
        const records = await client.fetchQuery({
          queryKey: tuple('/query', { target: rids }),
          queryFn: async ({ queryKey: [, body] }) => api.query(body),
          staleTime: Infinity,
        });
        const recordsByRid = Object.fromEntries(records.map((r) => [r['@rid'], r]));
        ['reference1', 'reference2', 'type'].forEach((key) => {
          if (result[key]) {
            result[key] = recordsByRid[result[key]];
          }
        });
      }
      return result;
    },
    enabled: prepopulateRequested && Boolean(inputValue),
    retry: false,
  });

  useEffect(() => {
    if (query.data && prepopulateRequested) {
      setInputValue('');
      setIsOpen(false);
      setPrepopulateRequested(false);
      onSubmit(query.data);
    }
  }, [query.data, onSubmit, prepopulateRequested]);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outlined">Prepopulate from HGVS Shorthand</Button>
      {isOpen && (
        <Dialog onClose={() => setIsOpen(false)} open>
          <DialogTitle>Prepopulate from HGVS Shorthand</DialogTitle>
          <DialogContent>
            <Typography>
              Positional variants in GraphKB use notation that is an extended form of HGVS. See
              {' '}
              <Link to="/about/notation">notation</Link>
              {' '}
              for more information about syntax.
            </Typography>
            <TextField
              aria-label="Positional Variant Notation"
              error={Boolean(query.error)}
              fullWidth
              helperText={query.error ? String(query.error) : undefined}
              onChange={(e) => setInputValue(e.target.value)}
              value={inputValue}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsOpen(false)} variant="outlined">Cancel</Button>
            <Button
              disabled={query.isFetching || !inputValue}
              loading={query.isFetching}
              onClick={() => setPrepopulateRequested(true)}
              variant="contained"
            >
              Prepopulate
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
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
            {variant === FORM_VARIANT.NEW && (
              <PrepopulateVariantButton onSubmit={(content) => updateForm(content, { replace: true })} />
            )}
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
        <FormLayout
          collapseExtra
          exclusions={FIELD_EXCLUSIONS}
        >
          <LayoutItem fullWidth>
            <RecordAutocomplete
              disabled={form.disabled}
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
          </LayoutItem>
          <LayoutItem fullWidth>
            <DropDownSelect
              disabled={form.disabled}
              error={Boolean(otherValidation?.coordinateType)}
              helperText={otherValidation?.coordinateType}
              label="Position Coordinate System"
              onChange={({ target: { value: newValue } }) => handleUpdateCoordinateType(newValue)}
              options={coordinateOptions}
              readOnly={variant === FORM_VARIANT.VIEW}
              required
              value={coordinateType}
            />
          </LayoutItem>
          <LayoutItem fullWidth>
            <BreakpointsForm
              coordinateType={coordinateType}
            />
          </LayoutItem>
        </FormLayout>
        {variant === FORM_VARIANT.VIEW && (
          <>
            <EdgeTable recordId={String(form.content['@rid'])} />
            <RelatedStatementsTable recordId={String(form.content['@rid'])} />
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
