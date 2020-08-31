import './index.scss';

import {
  Typography,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import ActionButton from '@/components/ActionButton';
import DropDownSelect from '@/components/DropDownSelect';
import FormContext from '@/components/FormContext';
import FormField from '@/components/FormField';
import FieldWrapper from '@/components/FormField/FieldWrapper';
import useSchemaForm from '@/components/hooks/useSchemaForm';
import { FORM_VARIANT } from '@/components/util';
import schema from '@/services/schema';

import { BLACKLISTED_PROPERTIES, DATE_FIELDS, OPERATORS } from '../constants';


const propertySort = ({ label: prop1 }, { label: prop2 }) => {
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


const constructOperatorOptions = ({ iterable, type, name } = {}, currentVal) => {
  // check if property is iterable and set corresponding option values
  if (iterable) {
    if (currentVal && Array.isArray(currentVal) && currentVal.length > 1) {
      return OPERATORS.filter(op => ['CONTAINSANY', 'CONTAINSALL', '='].includes(op.label));
    }
    return OPERATORS.filter(op => ['CONTAINS'].includes(op.label));
  } if (type === 'link') {
    if (currentVal && Array.isArray(currentVal) && currentVal.length > 1) {
      return OPERATORS.filter(op => ['IN'].includes(op.label));
    }
    return OPERATORS.filter(op => ['='].includes(op.label));
  }

  let options = OPERATORS.filter(op => !op.iterable && op.label !== 'IN');

  if (type !== 'long' && type !== 'integer') {
    options = options.filter(op => !op.isNumOperator || op.label === '=');
  }

  if (!(type === 'string') || name === '@rid') {
    options = options.filter(op => !(op.label === 'CONTAINSTEXT'));
  }
  return options;
};

/**
 * Form to choose a filter to add (property, value, operator)
 *
 * @property {string} props.modelName name of target model of query
 * @property {object} props.history history router object to navigate to different views
 */
const PropertyFilter = ({
  modelName, onSubmit, className,
}) => {
  const [property, setProperty] = useState('');
  const [propertyChoices, setPropertyChoices] = useState([]);
  const [propertyModel, setPropertyModel] = useState({
    type: 'string', name: 'value', mandatory: true, generated: false,
  });
  const [operatorChoices, setOperatorChoices] = useState(['=']);
  const [operator, setOperator] = useState(operatorChoices[0]);

  // use a schema form so that validation runs on the value based on the property selected
  const form = useSchemaForm({ [property]: propertyModel }, {}, { variant: FORM_VARIANT.SEARCH });
  const {
    formContent,
    formHasErrors,
  } = form;

  useEffect(() => {
    const choices = [];
    Object.values(schema.get(modelName).queryProperties)
      .filter(p => !BLACKLISTED_PROPERTIES.includes(p.name))
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
      } else if (choices.find(c => c.label === 'name')) {
        defaultProperty = 'name';
      }
      setProperty(defaultProperty);
    }
  }, [modelName]);

  useEffect(() => {
    if (property) {
      const [prop, subProp] = property.split('.');
      let newPropertyModel = schema.get(modelName).properties[prop];

      if (newPropertyModel && subProp) {
        if (newPropertyModel.linkedClass && newPropertyModel.linkedClass.embedded) {
          const parentPropModel = newPropertyModel;
          newPropertyModel = newPropertyModel.linkedClass.properties[subProp];

          if (subProp === '@class') {
            const choices = parentPropModel.linkedClass.subclasses.map(m => m.name);

            if (!parentPropModel.linkedClass.isAbstract) {
              choices.push(parentPropModel.linkedClass.name);
            }
            newPropertyModel.choices = choices;
          }
        } else {
          newPropertyModel = null;
        }
      }

      if (newPropertyModel) {
        setPropertyModel({ ...newPropertyModel, mandatory: true });
      }
    }
  }, [property, modelName]);

  // limit the choices for operators to select based on the property selected and the current value
  useEffect(() => {
    if (property) {
      const choices = constructOperatorOptions(propertyModel, formContent[property]);
      setOperatorChoices(choices);

      if (choices.length === 1) {
        setOperator(choices[0].value);
      } else if (choices.find(c => c.label === 'CONTAINSTEXT')) {
        setOperator('CONTAINSTEXT');
      }
    }
  }, [formContent, property, propertyModel]);

  const handleAddFilter = useCallback(() => {
    const [, subProp] = property.split('.');
    onSubmit({
      attr: property,
      value: subProp
        ? formContent[subProp]
        : formContent[property],
      operator,
      query: {
        operator,
        [property]: subProp
          ? formContent[subProp]
          : formContent[property],
      },
    });
  }, [formContent, onSubmit, operator, property]);

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
          <FieldWrapper className="property-filter__operator">
            <DropDownSelect
              disabled={!property || operatorChoices.length < 2}
              onChange={({ target: { value: newValue } }) => setOperator(newValue)}
              options={operatorChoices}
              value={operator}
            />
          </FieldWrapper>
          <FormContext.Provider
            value={form}
          >
            <FormField
              className="property-filter__value"
              disabled={!property}
              innerProps={{ 'data-testid': 'value-select' }}
              model={{ ...propertyModel, format }}
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

PropertyFilter.propTypes = {
  modelName: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  className: PropTypes.string,
};

PropertyFilter.defaultProps = {
  className: '',
};

export default PropertyFilter;
