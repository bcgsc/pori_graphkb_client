/**
 * RadioList based selection
 */
import './index.scss';

import {
  FormLabel,
  ListItemText,
  MenuItem,
  MenuList,
  Radio,
} from '@mui/material';
import isObject from 'lodash.isobject';
import React, { ReactNode, useId } from 'react';

interface Option<V = unknown> {
  label: string;
  value: V;
  caption?: ReactNode;
  key: string;
}

function asOption<V>(opt: Option<V> | V) {
  if (!isObject(opt)) {
    return {
      label: String(opt),
      key: String(opt),
      value: opt,
    };
  }
  return opt as Option<V>;
}

interface RadioSelectProps<V = unknown> {
  /** the options to display */
  options: (Option<V> | V)[];
  /** css class name to add to the top-level component */
  className?: string;
  /** optional label for the field */
  label?: string;
  /** the name to use for the input and reporting change to the parent handler */
  name?: string;
  /** the change handler to report the selection back to the parent */
  onChange?: (arg: { target: { name?: string; value: V } }) => unknown;
  /** the function to generate a key from a selection value */
  optionToKey?: (option: Option<V> | V) => string;
  /** the current value */
  value?: V;
}

/**
 * Select from a list of radio button options
 *
 * Add captions below choices when provided
 */
function RadioSelect<V>({
  options, onChange, className, label, value, optionToKey = (o) => asOption(o).key, name,
}: RadioSelectProps<V>) {
  const id = useId();
  return (
    <MenuList className={`radio-select ${className}`}>
      {label && (<FormLabel>{label}</FormLabel>)}
      {options.map((optionOrValue) => {
        const option = asOption(optionOrValue);
        const checked = Boolean(value === option.value);
        const key = optionToKey(option);
        return (
          <MenuItem
            key={key}
            className="radio-option"
            onClick={() => {
              onChange?.({ target: { name, value: option.value } });
            }}
            selected={checked}
          >
            <Radio
              checked={checked}
              slotProps={{
                input: {
                  'aria-labelledby': `${id}-${key}-label`,
                  [('data-testid' as any)]: `radio-option__${optionToKey(option)}`,
                },
              }}
            />
            <ListItemText
              primary={option.label}
              secondary={option.caption || ''}
              slotProps={{
                primary: { className: 'radio-option__title', id: `${id}-${key}-label` },
                secondary: { className: 'radio-option__caption' },
              }}
            />
          </MenuItem>
        );
      })}
    </MenuList>
  );
}

export default RadioSelect;
