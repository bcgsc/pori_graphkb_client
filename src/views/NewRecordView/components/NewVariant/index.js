import './index.scss';

import { schema } from '@bcgsc/knowledgebase-schema';
import { SnackbarContext } from '@bcgsc/react-snackbar-provider';
import { List } from '@material-ui/core';
import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import React, {
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

import FormField from '@/components/FormField';
import RadioSelect from '@/components/RadioSelect';
import FieldGroup from '@/components/RecordForm/FormLayout/FieldGroup';
import { cleanPayload, FORM_VARIANT, sortAndGroupFields } from '@/components/util';
import api from '@/services/api';

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
  ],
);
const { fields: positionalFields } = sortAndGroupFields(
  { properties: leftoverPositionalProps }, { collapseExtra: false, variant: FORM_VARIANT.NEW },
);

const leftoverCategoryProps = omit(
  CategoryVariant.properties,
  [
    'reference1',
    'reference2',
    'type',
  ],
);
const { fields: categoryFields } = sortAndGroupFields(
  { properties: leftoverCategoryProps }, { collapseExtra: false, variant: FORM_VARIANT.NEW },
);

const coordinateOptions = Position.descendantTree(true).map(m => ({
  label: m.name, value: m.name, key: m.name, caption: m.description,
}));

/**
 * Input form for new Variants
 *
 * @param {object} props
 * @param {function} props.onSubmit the handler to be called when the form is submitted
 * @param {function} props.onError the handler to be called when the submission throws an error
 */
const NewPositionalVariantForm = ({
  onSubmit, onError,
}) => {
  const [coordinateType, setCoordinateType] = useState('GenomicPosition');
  const [inputType, setInputType] = useState('Substitution');
  const snackbar = useContext(SnackbarContext);
  const controllers = useRef([]);

  const hasPositions = !inputType.endsWith('without Position Information');
  const isSubstitution = inputType === 'Substitution';
  const isFusion = inputType.includes('Translocation');

  /**
   * Handler for submission of a new record
   */
  const handleNewAction = useCallback(async (content) => {
    const payload = cleanPayload(content);
    const { routeName } = schema.get(payload);
    const call = api.post(routeName, payload);
    controllers.current.push(call);

    try {
      const result = await call.request();
      snackbar.add(`Sucessfully created the record ${result['@rid']}`);
      onSubmit(result);
    } catch (err) {
      console.error(err);
      snackbar.add(`Error (${err.name}) in creating the record`);
      onError({ error: err, content });
    }
  }, [onError, onSubmit, snackbar]);

  const model = hasPositions
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

  return (
    <SteppedForm
      className="new-variant"
      modelName={model.name}
      onSubmit={handleNewAction}
      properties={model.properties}
    >
      <FormStepWrapper
        caption="Changes to the initial selection here will affect downstream portions of the form"
        label="Pick the Input Type"
      >
        <RadioSelect
          onChange={({ target: { value: newValue } }) => setInputType(newValue)}
          options={[
            'Substitution',
            'Indel',
            'Multi-Reference (ex. Translocation)',
            'Multi-Reference (ex. Translocation) without Position Information',
            'Other Variant',
            'Other Variant without Position Information',
          ]}
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
        label="Input the First Breakpoint"
      >
        <BreakpointForm
          coordinateType={coordinateType}
          end={hasPositions && 'break1End'}
          reference="reference1"
          start={hasPositions && 'break1Start'}
        />
      </FormStepWrapper>
      {(!isSubstitution && (hasPositions || isFusion)) && (
        <FormStepWrapper
          fields={['break2Start', 'reference2', 'break2End']}
          label="Input the Second Breakpoint"
        >
          <BreakpointForm
            coordinateType={coordinateType}
            end={hasPositions && 'break2End'}
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
          <List className="record-form__content--long">
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
      <FormStepWrapper fields={['type']} label="Select the Variant Type">
        <FormField
          label="type"
          model={PositionalVariant.properties.type}
        />
      </FormStepWrapper>
      <FormStepWrapper
        fields={
          Object.values(
            hasPositions
              ? leftoverPositionalProps
              : leftoverCategoryProps,
          ).map(p => p.name)
        }
        label="Optional Information"
      >
        <List className="record-form__content--long">
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


NewPositionalVariantForm.propTypes = {
  onError: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default NewPositionalVariantForm;
