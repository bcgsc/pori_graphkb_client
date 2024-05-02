import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import React, { useEffect, useState } from 'react';

import DropDownSelect from '@/components/DropDownSelect';
import RadioSelect from '@/components/RadioSelect';

interface ModelSelectProps {
  /** the parent onChange handler */
  onChange: (arg: { target: { name?: string; value: unknown } }) => void;
  /** the top level model to be used as the base of the tree of models to collect as options */
  baseModel?: string;
  /** the default value to be selected when value is not given */
  defaultValue?: string;
  disabled?: boolean;
  /** flag to indicate the options should include abstract classes */
  includeAbstract?: boolean;
  /** the field name to use in passing events to the onChange handler */
  name?: string;
  /** the currently selected value */
  value?: string;
  /** the display type (radio or select) */
  variant?: string;
}

/**
 * Select a database model class
 */
const ModelSelect = ({
  baseModel, defaultValue, value, includeAbstract, onChange, name, variant, disabled, ...props
}: ModelSelectProps) => {
  const [choices, setChoices] = useState<any>([]);
  const model = value || defaultValue;

  useEffect(() => {
    // TODO: descendants returns what if model name is not found?
    const models = schemaDefn.descendants(baseModel || '', {excludeAbstract: !includeAbstract, includeSelf: true}).map((m) => ({
      label: m, value: m, caption: schemaDefn.get(m).description, key: m,
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
