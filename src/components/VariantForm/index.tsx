import './index.scss';

import { schema } from '@bcgsc-pori/graphkb-schema';
import { List } from '@material-ui/core';
import omit from 'lodash.omit';
import { useSnackbar } from 'notistack';
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import FieldGroup from '@/components/FormLayout/FieldGroup';
import RadioSelect from '@/components/RadioSelect';
import { cleanPayload, FORM_VARIANT, sortAndGroupFields } from '@/components/util';
import api from '@/services/api';

import { GeneralRecordType } from '../types';
import BreakpointForm from './BreakpointForm';
import FormStepWrapper from './FormStepWrapper';
import SteppedForm from './SteppedForm';

const { schema: { PositionalVariant, CategoryVariant, Position } } = schema;

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
  { properties: leftoverPositionalProps },
  { collapseExtra: false, variant: FORM_VARIANT.NEW },
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
  { properties: leftoverCategoryProps },
  { collapseExtra: false, variant: FORM_VARIANT.NEW },
);

const coordinateOptions = Position.descendantTree(true).map((m) => ({
  label: m.name, value: m.name, key: m.name, caption: m.description,
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
  onSubmit, onError, value, formVariant,
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
  const [model, setModel] = useState(null);

  const hasPositions = inputType !== MAJOR_FORM_TYPES.OTHER && inputType !== MAJOR_FORM_TYPES.TRANS;
  const isSubstitution = inputType === MAJOR_FORM_TYPES.SUB;
  const isFusion = inputType === MAJOR_FORM_TYPES.TRANS_WITH_POS || inputType === MAJOR_FORM_TYPES.TRANS;

  useEffect(() => {
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
          ...CategoryVariant.properties,
          reference2: { ...CategoryVariant.properties.reference2, mandatory: isFusion },
        },
      };
    setModel(newModel);
  }, [hasPositions, isSubstitution, isFusion]);

  /**
   * Handler for submission of a new (or updates to an existing) record
   */
  const handleSubmitAction = useCallback(async (content) => {
    const payload = cleanPayload(content);
    const { routeName } = schema.get(payload);

    const actionType = formVariant === FORM_VARIANT.NEW
      ? 'created'
      : 'edited';

    try {
      const result = await formVariant === FORM_VARIANT.NEW
        ? api.post(routeName, payload)
        : api.patch(`${routeName}/${content['@rid'].replace(/^#/, '')}`, payload);

      snackbar.enqueueSnackbar(`Sucessfully ${actionType} the record ${result['@rid']}`, { variant: 'success' });
      onSubmit(result);
    } catch (err) {
      console.error(err);
      snackbar.enqueueSnackbar(`Error (${err.name}) in ${actionType.replace(/ed$/, 'ing')} the record`, { variant: 'error' });
      onError({ error: err, content });
    }
  }, [formVariant, onError, onSubmit, snackbar]);

  const handleDeleteAction = useCallback(async (content) => {
    const payload = cleanPayload(content);
    const { routeName } = schema.get(payload);

    try {
      const result = await api.delete(`${routeName}/${content['@rid'].replace(/^#/, '')}`);
      snackbar.enqueueSnackbar(`Sucessfully deleted the record ${result['@rid']}`, { variant: 'success' });
      onSubmit(null);
    } catch (err) {
      console.error(err);
      snackbar.enqueueSnackbar(`Error (${err.name}) in deleting the record`, { variant: 'error' });
      onError({ error: err, content });
    }
  }, [onError, onSubmit, snackbar]);

  return model && (
    <SteppedForm
      className="new-variant"
      formVariant={formVariant}
      modelName={model.name}
      onDelete={handleDeleteAction}
      onSubmit={handleSubmitAction}
      properties={model.properties}
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

VariantForm.defaultProps = {
  value: {},
  formVariant: FORM_VARIANT.NEW,
};

export default VariantForm;
