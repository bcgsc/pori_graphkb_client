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

import { BLACKLISTED_PROPERTIES, OPERATORS } from '../constants';


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

const NEW_FILTER_GROUP = 'Add to new Filter Group';

/**
 * Form to choose a filter to add (property, value, operator)
 *
 * @property {string} props.modelName name of target model of query
 * @property {object} props.history history router object to navigate to different views
 */
const PropertyFilter = ({
  modelName, filterGroups, onSubmit, className,
}) => {
  const model = schema.get(modelName);

  const [property, setProperty] = useState('');
  const [propertyChoices, setPropertyChoices] = useState([]);
  const [operatorChoices, setOperatorChoices] = useState(['=']);
  const [operator, setOperator] = useState(operatorChoices[0]);

  useEffect(() => {
    const choices = Object.values(schema.get(modelName).queryProperties)
      .filter(p => !BLACKLISTED_PROPERTIES.includes(p.name))
      .map(p => ({
        label: p.name, value: p.name, key: p.name, caption: p.description,
      }));
    setPropertyChoices(choices);

    if (choices.length) {
      setProperty(choices[0].value);
    }
  }, [modelName]);

  const valueModel = {
    ...model.queryProperties[property] || { type: 'string' },
    name: 'value',
    mandatory: true,
    generated: false,
  };

  if (valueModel.type === 'link') {
    valueModel.type = 'linkset';
    valueModel.iterable = true;
  }

  // use a schema form so that validation runs on the value based on the property selected
  const form = useSchemaForm({ value: valueModel }, {}, { variant: FORM_VARIANT.SEARCH });
  const {
    formContent,
    formHasErrors,
  } = form;

  // limit the choices for operators to select based on the property selected and the current value
  useEffect(() => {
    if (property) {
      const { queryProperties } = schema.get(modelName);
      const choices = constructOperatorOptions(queryProperties[property], formContent.value);
      setOperatorChoices(choices);

      if (choices.length === 1) {
        setOperator(choices[0].value);
      }
    }
  }, [formContent.value, modelName, property]);


  const [filterGroup, setFilterGroup] = useState(NEW_FILTER_GROUP);

  // update the choices for filter groups when the user deletes all groups
  useEffect(() => {
    if (!filterGroups.includes(filterGroup)) {
      setFilterGroup(NEW_FILTER_GROUP);
    }
  }, [filterGroup, filterGroups]);

  const handleAddFilter = useCallback(() => {
    onSubmit({
      attr: property,
      value: formContent.value,
      operator,
      group: filterGroup === NEW_FILTER_GROUP
        ? ''
        : filterGroup,
    });
  }, [filterGroup, formContent.value, onSubmit, operator, property]);

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
              onChange={({ target: { value } }) => setProperty(value)}
              options={propertyChoices}
              value={property}
            />
          </FieldWrapper>
          <FieldWrapper className="property-filter__operator">
            <DropDownSelect
              disabled={!property || operatorChoices.length < 2}
              onChange={({ target: { value } }) => setOperator(value)}
              options={operatorChoices}
              value={operator}
            />
          </FieldWrapper>
          <FormContext.Provider value={form}>
            <FormField
              className="property-filter__value"
              disabled={!property}
              innerProps={{ 'data-testid': 'value-select' }}
              model={valueModel}
              variant="edit"
            />
          </FormContext.Provider>

        </div>
      </div>
      <div className="property-filter__add-filter-box">
        <div className="property-filter__add-filter-dropdown">
          <DropDownSelect
            onChange={({ target: { value } }) => setFilterGroup(value)}
            options={[NEW_FILTER_GROUP, ...filterGroups]}
            value={filterGroup}
          />
        </div>
        <ActionButton
          disabled={!property || formHasErrors || !operator}
          onClick={handleAddFilter}
          requireConfirm={false}
          variant="outlined"
        >
          ADD FILTER
        </ActionButton>
      </div>
    </>
  );
};

PropertyFilter.propTypes = {
  modelName: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  className: PropTypes.string,
  filterGroups: PropTypes.arrayOf(PropTypes.string),
};

PropertyFilter.defaultProps = {
  filterGroups: [],
  className: '',
};

export default PropertyFilter;
