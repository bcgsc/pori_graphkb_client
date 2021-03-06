import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import DropDownSelect from '@/components/DropDownSelect';
import RadioSelect from '@/components/RadioSelect';
import schema from '@/services/schema';


/**
 * Select a database model class
 *
 * @param {object} props
 * @param {string} props.baseModel the top level model to be used as the base of the tree of models to collect as options
 * @param {string} props.defaultValue the default value to be selected when value is not given
 * @param {string} props.value the currently selected value
 * @param {function} props.onChange the parent onChange handler
 * @param {bool} props.includeAbstract flag to indicate the options should include abstract classes
 * @param {string} props.name the field name to use in passing events to the onChange handler
 * @param {string} props.variant the display type (radio or select)
 */
const ModelSelect = ({
  baseModel, defaultValue, value, includeAbstract, onChange, name, variant, disabled, ...props
}) => {
  const [choices, setChoices] = useState([]);
  const model = value || defaultValue;

  useEffect(() => {
    const models = schema.get(baseModel).descendantTree(!includeAbstract).map(m => ({
      label: m.name, value: m.name, caption: m.description, key: m.name,
    })).sort((m1, m2) => m1.label.localeCompare(m2.label));
    setChoices(models);
  }, [baseModel, includeAbstract, name, onChange, value]);

  useEffect(() => {
    if (choices.length === 1 && model !== choices[0].value) {
      onChange({ target: { name, value: choices[0].value } });
    }
  }, [choices, model, name, onChange, value]);

  const BaseComponent = variant === 'radio'
    ? RadioSelect
    : DropDownSelect;

  if (!choices.length) {
    return null;
  }
  return (
    <BaseComponent
      disabled={choices.length < 2 || disabled}
      onChange={onChange}
      options={choices}
      value={model}
      {...props}
    />
  );
};

ModelSelect.propTypes = {
  onChange: PropTypes.func.isRequired,
  baseModel: PropTypes.string,
  defaultValue: PropTypes.string,
  disabled: PropTypes.bool,
  includeAbstract: PropTypes.bool,
  name: PropTypes.string,
  value: PropTypes.string,
  variant: PropTypes.string,
};

ModelSelect.defaultProps = {
  baseModel: 'V',
  defaultValue: '',
  includeAbstract: false,
  value: '',
  variant: 'select',
  disabled: false,
  name: '',
};

export default ModelSelect;
