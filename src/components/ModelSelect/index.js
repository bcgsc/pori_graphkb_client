import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import DropDownSelect from '@/components/DropDownSelect';
import RadioSelect from '@/components/RadioSelect';
import schema from '@/services/schema';


const ModelSelect = ({
  baseModel, defaultValue, value, includeAbstract, onChange, name, variant, disabled, ...props
}) => {
  const [choices, setChoices] = useState([]);
  const model = value || defaultValue;

  useEffect(() => {
    const models = schema.get(baseModel).descendantTree(!includeAbstract).map(m => ({
      label: m.name, value: m.name, caption: m.description, key: m.name,
    }));
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
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  baseModel: PropTypes.string,
  defaultValue: PropTypes.string,
  disabled: PropTypes.bool,
  includeAbstract: PropTypes.bool,
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
};

export default ModelSelect;
