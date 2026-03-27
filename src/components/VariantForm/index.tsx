import './index.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import { List } from '@mui/material';
import omit from 'lodash.omit';
import { useSnackbar } from 'notistack';
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useMutation, useQueryClient } from 'react-query';

import FieldGroup from '@/components/FormLayout/FieldGroup';
import RadioSelect from '@/components/RadioSelect';
import { cleanPayload, FORM_VARIANT, sortAndGroupFields } from '@/components/util';
import api from '@/services/api';

import { GeneralRecordType } from '../types';
import BreakpointForm from './BreakpointForm';
import FormStepWrapper from './FormStepWrapper';
import SteppedForm from './SteppedForm';

const PositionalVariant = schemaDefn.get('PositionalVariant');
const CategoryVariant = schemaDefn.get('CategoryVariant');

const leftoverPositionalProps = omit(
  schemaDefn.getProperties('PositionalVariant'),
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
  { collapseExtra: false, variant: FORM_VARIANT.NEW },
);

const leftoverCategoryProps = omit(
  schemaDefn.getProperties('CategoryVariant'),
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
  { collapseExtra: false, variant: FORM_VARIANT.NEW },
);

const coordinateOptions = schemaDefn.descendants('Position', { excludeAbstract: true, includeSelf: true }).map((m) => ({
  label: m, value: m, key: m, caption: schemaDefn.get(m).description,
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
  /** the handler to be called when the submission throws an error */
  onError: (arg: { error: unknown; content: unknown }) => void;
  /** the handler to be called when the form is submitted */
  onSubmit: (record?: GeneralRecordType | null) => void;
  formVariant?: FORM_VARIANT;
  value?: GeneralRecordType;
}

/**
 * Input form for new Variants
 */
const VariantForm = ({
  onSubmit, onError, value = {}, formVariant,
}: VariantFormProps) => {
  let defaultCoordinateType;

  if (value?.break1Start) {
    defaultCoordinateType = value.break1Start['@class'];
  }
  const [coordinateType, setCoordinateType] = useState(defaultCoordinateType || 'GenomicPosition');

  const [inputType, setInputType] = useState(
    formVariant === FORM_VARIANT.NEW
      ? MAJOR_FORM_TYPES.SUB
      : pickInputType(value),
  );
  const snackbar = useSnackbar();
  const [model, setModel] = useState<any>(null);

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

  useEffect(() => {
    const newModel = hasPositions
      ? {
        name: PositionalVariant.name,
        properties: {
          ...schemaDefn.getProperties('PositionalVariant'),
          break2Start: { ...schemaDefn.getProperty('PositionalVariant', 'break2Start'), mandatory: !isSubstitution },
          reference2: { ...schemaDefn.getProperty('PositionalVariant', 'reference2'), mandatory: isFusion },
          refSeq: { ...schemaDefn.getProperty('PositionalVariant', 'refSeq'), mandatory: isSubstitution },
          untemplatedSeq: {
            ...schemaDefn.getProperty('PositionalVariant', 'untemplatedSeq'),
            mandatory: isSubstitution,
          },
        },
      }
      : {
        name: CategoryVariant.name,
        properties: {
          ...schemaDefn.getProperties('PositionalVariant'),
          reference2: { ...schemaDefn.getProperty('PositionalVariant', 'reference2'), mandatory: isFusion },
        },
      };
    setModel(newModel);
  }, [hasPositions, isSubstitution, isFusion]);

  /**
   * Mutation for submitting (creating or updating) a variant record
   */
  const submitMutation = useMutation(
    async (content) => {
      const payload = cleanPayload(content);

      /* KBDEV-1216 Adding refAA to break1Start property when new variant has ProteinPosition coordinate system.
      Property has the same value as refSeq and should be hidden from users to avoid confusion. */
      if (payload?.break1Start && payload?.break1Start['@class'] === 'ProteinPosition') {
        const refAA = payload.refSeq ? payload.refSeq : '';
        payload.break1Start = { ...payload.break1Start, refAA };
      }

      const { routeName } = schemaDefn.get(payload);

      if (formVariant === FORM_VARIANT.NEW) {
        return api.post(routeName, payload);
      }
      const { displayName, ...rest } = payload;
      return api.patch(`${routeName}/${content['@rid'].replace(/^#/, '')}`, rest);
    },
    {
      onSuccess: (result) => {
        const actionType = formVariant === FORM_VARIANT.NEW ? 'created' : 'edited';

        if (result['@rid']) {
          const { routeName } = schemaDefn.get(result);
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
      onError: (error: any, content) => {
        const actionType = formVariant === FORM_VARIANT.NEW ? 'creating' : 'editing';
        console.error(error);
        snackbar.enqueueSnackbar(`Error (${error.name}) in ${actionType} the record`, { variant: 'error' });
        onError({ error, content });
      },
    },
  );

  const deleteMutation = useMutation(
    async (content) => {
      const payload = cleanPayload(content);
      const { routeName } = schemaDefn.get(payload);
      return api.delete(`${routeName}/${content['@rid'].replace(/^#/, '')}`);
    },
    {
      onSuccess: (result) => {
        queryClient.invalidateQueries();
        snackbar.enqueueSnackbar(`Sucessfully deleted the record ${result['@rid']}`, { variant: 'success' });
        onSubmit(null);
      },
      onError: (error: any, content) => {
        console.error(error);
        snackbar.enqueueSnackbar(`Error (${error.name}) in deleting the record`, { variant: 'error' });
        onError({ error, content });
      },
    },
  );

  const handleSubmitAction = useCallback((content) => {
    submitMutation.mutate(content);
  }, [submitMutation]);

  const handleDeleteAction = useCallback((content) => {
    deleteMutation.mutate(content);
  }, [deleteMutation]);

  return model && (
    <SteppedForm
      className="new-variant"
      formVariant={formVariant}
      isLoading={submitMutation.isLoading || deleteMutation.isLoading}
      modelName={model.name}
      onDelete={handleDeleteAction}
      onSubmit={handleSubmitAction}
      properties={schemaDefn.getProperties(model.name)}
      value={value}
    >
      <FormStepWrapper
        caption="Changes to the initial selection here will affect downstream portions of the form"
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
          end={hasPositions && 'break1End'}
          model={model}
          reference="reference1"
          start={hasPositions && 'break1Start'}
        />
      </FormStepWrapper>
      {(!isSubstitution && (hasPositions || isFusion)) && (
        <FormStepWrapper
          fields={['break2Start', 'reference2', 'break2End']}
          label={`Input the Second ${hasPositions ? 'Breakpoint' : 'Reference Element'}`}
        >
          <BreakpointForm
            coordinateType={coordinateType}
            end={hasPositions && 'break2End'}
            model={model}
            reference={isFusion && 'reference2'}
            start={hasPositions && 'break2Start'}
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
                    ...schemaDefn.getProperty('PositionalVariant', 'refSeq'),
                    mandatory: isSubstitution,
                  },
                  untemplatedSeq: {
                    ...schemaDefn.getProperty('PositionalVariant', 'untemplatedSeq'),
                    mandatory: isSubstitution,
                  },
                  untemplatedSeqSize: schemaDefn.getProperty('PositionalVariant', 'untemplatedSeqSize'),
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
              type: schemaDefn.getProperty('PositionalVariant', 'type'),
              zygosity: schemaDefn.getProperty('PositionalVariant', 'zygosity'),
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

VariantForm.defaultProps = {
  value: {},
  formVariant: FORM_VARIANT.NEW,
};

export default VariantForm;
