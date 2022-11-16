import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import React, { useEffect, useState } from 'react';

import DropDownSelect, { SelectOption } from '@/components/DropDownSelect';
import RadioSelect from '@/components/RadioSelect';

interface ModelSelectProps {
  /** the parent onChange handler */
  onChange: (arg: { target: { name?: string; value: unknown } }) => void;
  /** the top level model to be used as the base of the tree of models to collect as options */
  baseModel: string;
  /** flag to indicate the options should include abstract classes */
  includeAbstract?: boolean;
  /** the currently selected value */
  value?: string;
  /** the display type (radio or select) */
  variant?: string;
  className?: string;
}

/**
 * Select a database model class
 */
const ModelSelect = ({
  baseModel, value, includeAbstract, onChange, variant, className,
}: ModelSelectProps) => {
  const [choices, setChoices] = useState<SelectOption[]>([]);
  const model = value;

  useEffect(() => {
    const models = schemaDefn.get(baseModel).descendantTree(!includeAbstract).map((m) => ({
      label: m.name, value: m.name, caption: m.description, key: m.name,
    })).sort((m1, m2) => m1.label.localeCompare(m2.label));
    setChoices(models);
  }, [baseModel, includeAbstract, onChange, value]);

  useEffect(() => {
    if (choices.length === 1 && model !== choices[0].value) {
      onChange({ target: { name: '', value: choices[0].value } });
    }
  }, [choices, model, onChange, value]);

  const BaseComponent = variant === 'radio'
    ? RadioSelect
    : DropDownSelect;

  if (!choices.length) {
    return null;
  }
  return (
    <BaseComponent
      className={className}
      disabled={choices.length < 2}
      onChange={onChange}
      options={choices}
      value={model}
    />
  );
};

ModelSelect.defaultProps = {
  includeAbstract: false,
  value: '',
  variant: 'select',
  className: '',
};

export default ModelSelect;
