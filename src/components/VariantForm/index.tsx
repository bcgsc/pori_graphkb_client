import './index.scss';

import { List } from '@mui/material';
import { omit } from 'lodash';
import { useSnackbar } from 'notistack';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useMutation, useQueryClient } from 'react-query';

import FieldGroup from '@/components/FormLayout/FieldGroup';
import RadioSelect from '@/components/RadioSelect';
import { cleanPayload, FORM_VARIANT, sortAndGroupFields } from '@/components/util';
import api from '@/services/api';
import { ErrorMessage } from '@/services/errors';
import schema from '@/services/schema';

import { GeneralRecordType } from '../types';
import BreakpointForm from './BreakpointForm';
import FormStepWrapper from './FormStepWrapper';
import SteppedForm from './SteppedForm';

const PositionalVariant = schema.get('PositionalVariant');
const CategoryVariant = schema.get('CategoryVariant');

const leftoverPositionalProps = omit(
  PositionalVariant.properties,
  [
    'break1Start',
    'break1End',
    'break2Start',
    'break2End',
    'reference1',
    'reference2',
    'type',
    'refSeq',
    'untemplatedSeq',
    'untemplatedSeqSize',
    'zygosity',
    'displayName',
  ],
);
const { fields: positionalFields } = sortAndGroupFields(
  leftoverPositionalProps,
  { collapseExtra: false },
);

const leftoverCategoryProps = omit(
  CategoryVariant.properties,
  [
    'reference1',
    'reference2',
    'type',
    'zygosity',
    'displayName',
  ],
);
const { fields: categoryFields } = sortAndGroupFields(
  leftoverCategoryProps,
  { collapseExtra: false },
);

const coordinateOptions = schema.descendants('Position', { excludeAbstract: true, includeSelf: true }).map((m) => ({
  label: m, value: m, key: m, caption: schema.get(m).description,
}));

const MAJOR_FORM_TYPES = {
  SUB: 'Substitution',
  INDEL: 'Indel',
  TRANS_WITH_POS: 'Multi-Reference (ex. Translocation)',
  TRANS: 'Multi-Reference (ex. Translocation) without Position Information',
  OTHER_WITH_POS: 'Other Variant',
  OTHER: 'Other Variant without Position Information',
};

const pickInputType = (record) => {
  if (record['@class'] === 'PositionalVariant') {
    if (record.reference2) {
      return MAJOR_FORM_TYPES.TRANS_WITH_POS;
    } if (record.type && record.type.name) {
      if (record.type.name === 'substitution') {
        return MAJOR_FORM_TYPES.SUB;
      }
    }
    return MAJOR_FORM_TYPES.OTHER_WITH_POS;
  } if (record.reference2) {
    return MAJOR_FORM_TYPES.TRANS;
  }
  return MAJOR_FORM_TYPES.OTHER;
};

interface VariantFormProps {
  /** the handler to be called when the form is submitted */
  onSubmit: (record?: GeneralRecordType | null) => void;
  formVariant?: FORM_VARIANT;
  value?: GeneralRecordType;
}

/**
 * Input form for new Variants
 */
const VariantForm = ({
  onSubmit, value = {}, formVariant = FORM_VARIANT.NEW,
}: VariantFormProps) => {
  let defaultCoordinateType;

  if (value.break1Start) {
    defaultCoordinateType = value.break1Start['@class'];
  }
  const [coordinateType, setCoordinateType] = useState(defaultCoordinateType || 'GenomicPosition');

  const [inputType, setInputType] = useState(
    formVariant === FORM_VARIANT.NEW
      ? MAJOR_FORM_TYPES.SUB
      : pickInputType(value),
  );
  const snackbar = useSnackbar();

  useEffect(() => {
    if (formVariant !== FORM_VARIANT.NEW && value) {
      setInputType(pickInputType(value));

      if (value?.break1Start) {
        setCoordinateType(value.break1Start['@class']);
      }
    }
  }, [value, formVariant]);

  const hasPositions = inputType !== MAJOR_FORM_TYPES.OTHER && inputType !== MAJOR_FORM_TYPES.TRANS;
  const isSubstitution = inputType === MAJOR_FORM_TYPES.SUB;
  const isFusion = inputType === MAJOR_FORM_TYPES.TRANS_WITH_POS || inputType === MAJOR_FORM_TYPES.TRANS;
  const queryClient = useQueryClient();

  const model = useMemo(() => {
    const newModel = hasPositions
      ? {
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
      }
      : {
        name: CategoryVariant.name,
        properties: {
          ...PositionalVariant.properties,
          reference2: { ...PositionalVariant.properties.reference2, mandatory: isFusion },
        },
      };
    return newModel;
  }, [hasPositions, isSubstitution, isFusion]);

  /**
   * Mutation for submitting (creating or updating) a variant record
   */
  const submitMutation = useMutation({
    mutationFn: async (content) => {
      const payload = cleanPayload(content);

      /* KBDEV-1216 Adding refAA to break1Start property when new variant has ProteinPosition coordinate system.
      Property has the same value as refSeq and should be hidden from users to avoid confusion. */
      if (payload?.break1Start && payload?.break1Start['@class'] === 'ProteinPosition') {
        const refAA = payload.refSeq ? payload.refSeq : '';
        payload.break1Start = { ...payload.break1Start, refAA };
      }

      const { routeName } = schema.get(payload);

      if (formVariant === FORM_VARIANT.NEW) {
        return api.post(routeName, payload);
      }
      const { displayName: _, ...rest } = payload;
      return api.patch(`${routeName}/${content['@rid'].replace(/^#/, '')}`, rest);
    },
    onSuccess: (result) => {
      const actionType = formVariant === FORM_VARIANT.NEW ? 'created' : 'edited';

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
      onSubmit(result);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (content) => {
      const payload = cleanPayload(content);
      const { routeName } = schema.get(payload);
      return api.delete(`${routeName}/${content['@rid'].replace(/^#/, '')}`);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries();
      snackbar.enqueueSnackbar(`Sucessfully deleted the record ${result['@rid']}`, { variant: 'success' });
      onSubmit(null);
    },
  });

  const handleSubmitAction = useCallback((content) => {
    submitMutation.mutate(content);
  }, [submitMutation]);

  const handleDeleteAction = useCallback((content) => {
    deleteMutation.mutate(content);
  }, [deleteMutation]);

  return model && (
    <SteppedForm
      className="new-variant"
      errors={(
        <>
          <ErrorMessage error={submitMutation.error}>An error occurred while creating/editing record.</ErrorMessage>
          <ErrorMessage error={deleteMutation.error}>An error occurred while deleting record.</ErrorMessage>
        </>
      )}
      formVariant={formVariant}
      isLoading={submitMutation.isPending || deleteMutation.isPending}
      model={model}
      modelName={model.name}
      onDelete={handleDeleteAction}
      onSubmit={handleSubmitAction}
      value={value}
    >
      <FormStepWrapper
        label="Pick the Input Type"
      >
        <RadioSelect
          onChange={({ target: { value: newValue } }) => setInputType(newValue)}
          options={Object.values(MAJOR_FORM_TYPES)}
          value={inputType}
        />
      </FormStepWrapper>
      {hasPositions && (
        <FormStepWrapper label="Pick the Position Coordinate System">
          <RadioSelect
            onChange={({ target: { value: newValue } }) => setCoordinateType(newValue)}
            options={coordinateOptions}
            value={coordinateType}
          />
        </FormStepWrapper>
      )}
      <FormStepWrapper
        fields={['break1Start', 'reference1', 'break1End']}
        label={`Input the ${(isFusion || (hasPositions && !isSubstitution)) ? 'First ' : ''}${hasPositions ? 'Breakpoint' : 'Reference Element'}`}
      >
        <BreakpointForm
          coordinateType={coordinateType}
          end={hasPositions ? 'break1End' : undefined}
          model={model}
          reference="reference1"
          start={hasPositions ? 'break1Start' : undefined}
        />
      </FormStepWrapper>
      {(!isSubstitution && (hasPositions || isFusion)) && (
        <FormStepWrapper
          fields={['break2Start', 'reference2', 'break2End']}
          label={`Input the Second ${hasPositions ? 'Breakpoint' : 'Reference Element'}`}
        >
          <BreakpointForm
            coordinateType={coordinateType}
            end={hasPositions ? 'break2End' : undefined}
            model={model}
            reference={isFusion ? 'reference2' : undefined}
            start={hasPositions ? 'break2Start' : undefined}
          />
        </FormStepWrapper>
      )}
      {hasPositions && (
        <FormStepWrapper
          fields={['refSeq', 'untemplatedSeq', 'untemplatedSeqSize']}
          label="Input ref/alt Sequence"
        >
          <List className="form-layout__content--long">
            <FieldGroup
              disabled={false}
              model={{
                properties: {
                  refSeq: {
                    ...PositionalVariant.properties.refSeq,
                    mandatory: isSubstitution,
                  },
                  untemplatedSeq: {
                    ...PositionalVariant.properties.untemplatedSeq,
                    mandatory: isSubstitution,
                  },
                  untemplatedSeqSize: PositionalVariant.properties.untemplatedSeqSize,
                },
              }}
              ordering={['refSeq', ['untemplatedSeq', 'untemplatedSeqSize']]}
            />
          </List>
        </FormStepWrapper>
      )}
      <FormStepWrapper fields={['type', 'zygosity']} label="Select the Variant Type">
        <FieldGroup
          disabled={false}
          model={{
            properties: {
              type: PositionalVariant.properties.type,
              zygosity: PositionalVariant.properties.zygosity,
            },
          }}
          ordering={['type', 'zygosity']}
        />
      </FormStepWrapper>
      <FormStepWrapper
        fields={
          Object.values(
            hasPositions
              ? leftoverPositionalProps
              : leftoverCategoryProps,
          ).map((p) => p.name)
        }
        label="Optional Information"
      >
        <List className="form-layout__content--long">
          <FieldGroup
            disabled={false}
            model={
            hasPositions
              ? PositionalVariant
              : CategoryVariant
          }
            ordering={
            hasPositions
              ? positionalFields
              : categoryFields
          }
          />
        </List>
      </FormStepWrapper>
    </SteppedForm>
  );
};

export default VariantForm;
