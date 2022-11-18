import './index.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import {
  Typography,
} from '@material-ui/core';
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import ActionButton from '@/components/ActionButton';
import DropDownSelect, { SelectOption } from '@/components/DropDownSelect';
import FormContext from '@/components/FormContext';
import FormField from '@/components/FormField';
import FieldWrapper from '@/components/FormField/FieldWrapper';
import useSchemaForm from '@/components/hooks/useSchemaForm';
import { PropertyDefinition, QueryFilter } from '@/components/types';
import { FORM_VARIANT } from '@/components/util';
import schema from '@/services/schema';

import {
  BLACKLISTED_PROPERTIES, DATE_FIELDS, OperatorOption, OPERATORS,
} from '../constants';
import SubqueryTypeSelector from './SubqueryTypeSelector';

const propertySort = ({ label: prop1 }: SelectOption, { label: prop2 }: SelectOption) => {
  if (prop1.startsWith('break1') && prop2.startsWith('break1')) {
    prop1 = prop1.replace('break1', '');
    prop2 = prop2.replace('break1', '');
    const order = ['Start.@class', 'End.@class', 'Repr'];
    return order.indexOf(prop1) - order.indexOf(prop2);
  } if (prop1.startsWith('break2') && prop2.startsWith('break2')) {
    prop1 = prop1.replace('break2', '');
    prop2 = prop2.replace('break2', '');
    const order = ['Start.@class', 'End.@class', 'Repr'];
    return order.indexOf(prop1) - order.indexOf(prop2);
  }
  return prop1.localeCompare(prop2);
};

const constructOperatorOptions = ({ iterable, type, name }: Partial<PropertyDefinition> = {}, currentVal, subqueryType = '') => {
  if (subqueryType === 'keyword') {
    return OPERATORS.filter((op) => ['CONTAINSTEXT', '='].includes(op.label));
  }
  // check if property is iterable and set corresponding option values
  if (iterable) {
    if (currentVal && Array.isArray(currentVal) && currentVal.length > 1) {
      return OPERATORS.filter((op) => ['CONTAINSANY', 'CONTAINSALL', '='].includes(op.label));
    }
    return OPERATORS.filter((op) => ['CONTAINS'].includes(op.label));
  }
  if (type === 'link') {
    if (currentVal && Array.isArray(currentVal) && currentVal.length > 0) {
      return OPERATORS.filter((op) => ['IN'].includes(op.label));
    }
    return OPERATORS.filter((op) => ['='].includes(op.label));
  }

  let options = OPERATORS.filter((op) => !op.iterable && op.label !== 'IN');

  if (type !== 'long' && type !== 'integer') {
    options = options.filter((op) => !op.isNumOperator || op.label === '=');
  }

  if (!(type === 'string') || name === '@rid') {
    options = options.filter((op) => !(op.label === 'CONTAINSTEXT'));
  }
  return options;
};

interface PropertyFilterProps {
  /** name of target model of query */
  modelName: string;
  onSubmit: (result: QueryFilter) => void;
  className?: string;
}

/**
 * Form to choose a filter to add (property, value, operator)
 */
const PropertyFilter = ({
  modelName, onSubmit, className,
}: PropertyFilterProps) => {
  const [property, setProperty] = useState('');
  const [propertyChoices, setPropertyChoices] = useState<SelectOption[]>([]);
  const [propertyModel, setPropertyModel] = useState<PropertyDefinition>({
    type: 'string', name: 'value', mandatory: true, generated: false,
  });
  const [operatorChoices, setOperatorChoices] = useState<(OperatorOption | string)[]>(['=']);
  const [operator, setOperator] = useState(operatorChoices[0] as string);
  const [subqueryType, setSubqueryType] = useState<React.ComponentProps<typeof SubqueryTypeSelector>['value']>('');
  const [canSubquery, setCanSubquery] = useState(false);
  const [keywordTarget, setKeywordTarget] = useState('');
  const [keywordTargetOptions, setKeywordTargetOptions] = useState<string[]>([]);

  // use a schema form so that validation runs on the value based on the property selected
  const form = useSchemaForm({ [property]: propertyModel }, {}, { variant: FORM_VARIANT.SEARCH });
  const {
    formContent,
    formHasErrors,
  } = form;

  // set the property options
  useEffect(() => {
    const choices: SelectOption[] = [];
    schema.getQueryProperties(modelName)
      .filter((p) => !BLACKLISTED_PROPERTIES.includes(p.name))
      .forEach((prop) => {
        if (prop.type.includes('embedded')) {
          if (prop.linkedClass) {
            Object.values(prop.linkedClass.properties).forEach((subProp) => {
              const key = `${prop.name}.${subProp.name}`;
              choices.push({
                label: key, value: key, key, caption: subProp.description,
              });
            });
          }
        } else {
          choices.push({
            label: prop.name, value: prop.name, key: prop.name, caption: prop.description,
          });
        }
      });
    choices.sort(propertySort);
    setPropertyChoices(choices);

    if (choices.length) {
      let defaultProperty = choices[0].value;

      if (modelName === 'Statement') {
        defaultProperty = 'relevance';
      } if (['PositionalVariant', 'CategoryVariant'].includes(modelName)) {
        defaultProperty = 'reference1';
      } else if (choices.find((c) => c.label === 'name')) {
        defaultProperty = 'name';
      }
      setProperty(defaultProperty);
    }
  }, [modelName]);

  // set the property model
  useEffect(() => {
    if (property) {
      const [prop, subProp] = property.split('.');
      let newPropertyModel: PropertyDefinition | null = { ...schema.getQueryProperties(modelName).find((p) => p.name === prop), mandatory: true } as PropertyDefinition;

      if (subqueryType === 'keyword') {
        setPropertyModel({ name: property, type: 'string', mandatory: true });
      } else {
        if (subProp) {
          if (newPropertyModel.linkedClass && newPropertyModel.linkedClass.embedded) {
            const parentPropModel = newPropertyModel;
            newPropertyModel = newPropertyModel.linkedClass.properties[subProp];

            if (subProp === '@class') {
              const choices = (parentPropModel.linkedClass as NonNullable<typeof parentPropModel['linkedClass']>).subclasses.map((m) => m.name);

              if (!(parentPropModel.linkedClass as NonNullable<typeof parentPropModel['linkedClass']>).isAbstract) {
                choices.push((parentPropModel.linkedClass as NonNullable<typeof parentPropModel['linkedClass']>).name);
              }
              newPropertyModel.choices = choices;
            }
          } else {
            newPropertyModel = null;
          }
        } else if (newPropertyModel.type === 'link') {
          newPropertyModel.type = 'linkset';
          newPropertyModel.iterable = true;
        }

        setPropertyModel({ type: 'string', ...newPropertyModel, mandatory: true });
      }
    }
  }, [property, modelName, subqueryType]);

  // set the subquery status
  useEffect(() => {
    const originalPropertyModel = schema.getQueryProperties(modelName).find((p) => p.name === property);

    if (
      originalPropertyModel
      && originalPropertyModel.type.includes('link')
    ) {
      setCanSubquery(true);
    } else {
      setSubqueryType('');
      setCanSubquery(false);
    }
  }, [modelName, property]);

  // if the keyword subquery is selected then this requires a target
  useEffect(() => {
    if (subqueryType !== 'keyword') {
      setKeywordTarget('');
    }
  }, [subqueryType]);

  // limit the choices for operators to select based on the property selected and the current value
  useEffect(() => {
    const originalPropertyModel = schema.getQueryProperties(modelName).find((p) => p.name === property);

    if (property) {
      const choices = constructOperatorOptions(
        originalPropertyModel,
        formContent[property],
        subqueryType,
      );
      setOperatorChoices(choices);

      if (choices.length === 1) {
        setOperator(choices[0].value);
      } else if (choices.find((c) => c.label === 'CONTAINSTEXT')) {
        setOperator('CONTAINSTEXT');
      }
    }
  }, [formContent, modelName, property, subqueryType]);

  useEffect(() => {
    const originalPropertyModel = schema.getQueryProperties(modelName).find((p) => p.name === property);

    if (property && subqueryType === 'keyword') {
      const linkedModel = originalPropertyModel.linkedClass || schemaDefn.get('V');
      setKeywordTargetOptions(linkedModel.descendantTree(false).map((m) => m.name).sort());
      setKeywordTarget(linkedModel.name);
    }
  }, [modelName, property, subqueryType]);

  const handleAddFilter = useCallback(() => {
    const originalPropertyModel = schema.getQueryProperties(modelName).find((p) => p.name === property);
    const [, subProp] = property.split('.');
    const result: QueryFilter = {
      attr: property,
      value: subProp
        ? formContent[subProp]
        : formContent[property],
      operator,
      subqueryType,
    };

    if (subqueryType === 'keyword') {
      result.query = {
        operator: originalPropertyModel.iterable
          ? 'CONTAINSANY'
          : 'IN',
        [property]: {
          queryType: 'similarTo',
          treeEdges: keywordTarget === 'Feature'
            ? ['ElementOf']
            : [],
          target: {
            target: keywordTarget || originalPropertyModel.linkedClass.name || 'V',
            operator,
            keyword: formContent[property],
            queryType: 'keyword',
          },
        },
      };
    } else if (subqueryType === 'tree') {
      result.query = {
        operator: originalPropertyModel.iterable
          ? 'CONTAINSANY'
          : 'IN',
        [property]: {
          queryType: 'similarTo',
          treeEdges: [],
          target: {
            target: Array.isArray(formContent[property])
              ? formContent[property]
              : [formContent[property]],
            queryType: 'ancestors',
          },
        },
      };
    } else {
      let value = subProp
        ? formContent[subProp]
        : formContent[property];

      if (operator === 'CONTAINS' && value.length === 1) {
        // special case. CONTAINS is marked iterable for entry convenience for the user
        [value] = value;
      }
      result.query = {
        operator,
        [property]: value,
      };
    }
    onSubmit(result);
  }, [formContent, keywordTarget, modelName, onSubmit, operator, property, subqueryType]);

  let format = '';

  if (DATE_FIELDS.includes(property)) {
    format = 'date';
  }

  return (
    <>
      <div className={`property-filter ${className}`}>
        <Typography className="property-filter__title" variant="h5">
          Add New Filter
        </Typography>
        <div className="property-filter__content">
          <FieldWrapper className="property-filter__property">
            <DropDownSelect
              innerProps={{ 'data-testid': 'prop-select' }}
              onChange={({ target: { value: newValue } }) => setProperty(newValue)}
              options={propertyChoices}
              value={property}
            />
          </FieldWrapper>
          <FieldWrapper className="property-filter__subquery">
            <SubqueryTypeSelector
              disabled={!canSubquery}
              onChange={({ target: { value: newValue } }) => setSubqueryType(newValue)}
              value={subqueryType}
            />
          </FieldWrapper>
          <FieldWrapper className="property-filter__operator">
            <DropDownSelect
              disabled={!property || operatorChoices.length < 2}
              onChange={({ target: { value: newValue } }) => setOperator(newValue)}
              options={operatorChoices}
              value={operator}
            />
          </FieldWrapper>
          {property && subqueryType === 'keyword' && (
          <FieldWrapper className="property-filter__keyword-target">
            <DropDownSelect
              disabled={keywordTargetOptions.length < 2}
              onChange={({ target: { value: newValue } }) => setKeywordTarget(newValue)}
              options={keywordTargetOptions}
              value={keywordTarget}
            />
          </FieldWrapper>
          )}
          <FormContext.Provider
            value={form}
          >
            <FormField
              className="property-filter__value"
              disabled={!property}
              innerProps={{ 'data-testid': 'value-select' }}
              model={{ type: 'string', ...propertyModel, format }}
              variant="edit"
            />
          </FormContext.Provider>

        </div>
      </div>
      <div className="property-filter__actions">
        <ActionButton
          disabled={!property || formHasErrors || !operator}
          onClick={handleAddFilter}
          requireConfirm={false}
          variant="outlined"
        >
          add to selected group
        </ActionButton>
      </div>
    </>
  );
};

PropertyFilter.defaultProps = {
  className: '',
};

export default PropertyFilter;
