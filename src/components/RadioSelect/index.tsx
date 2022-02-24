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
} from '@material-ui/core';
import React from 'react';

type Option = string | { label?: string, value?: unknown; key?: string };
interface RadioSelectProps {
  /** the options to display */
  options: Option[];
  /** css class name to add to the top-level component */
  className?: string;
  /** optional label for the field */
  label?: string;
  /** the name to use for the input and reporting change to the parent handler */
  name?: string;
  /** the change handler to report the selection back to the parent */
  onChange?: (e: { target: { name: string | undefined; value: unknown } }) => unknown;
  /** the function to generate a key from a selection value */
  optionToKey?: (arg: Option) => string;
  /** the current value */
  value?: unknown;
}

/**
  * Select from a list of radio button options
  *
  * Add captions below choices when provided
  */
function RadioSelect(props: RadioSelectProps) {
  const {
    options,
    onChange = () => {},
    className,
    label,
    value,
    optionToKey = (o) => (o.key || o),
    name,
  } = props;
  return (
    <MenuList className={`radio-select ${className}`}>
      {label && (<FormLabel>{label}</FormLabel>)}
      {options.map((option) => {
        const optionValue = option.value === undefined ? option : option.value;
        const checked = Boolean(value === optionValue);
        return (
          <MenuItem
            key={optionToKey(option)}
            className="radio-option"
            onClick={() => {
              onChange({ target: { name, value: optionValue } });
            }}
            selected={checked}
            value={optionValue}
          >
            <Radio checked={checked} inputProps={{ 'data-testid': `radio-option__${optionToKey(option)}` }} />
            <ListItemText
              primary={option.label || option}
              primaryTypographyProps={{ className: 'radio-option__title' }}
              secondary={option.caption || ''}
              secondaryTypographyProps={{ className: 'radio-option__caption' }}
            />
          </MenuItem>
        );
      })}
    </MenuList>
  );
}

RadioSelect.defaultProps = {
  label: '',
  name: '',
  onChange: () => {},
  className: '',
  value: null,
  optionToKey: (o) => o.key || o,
};

export default RadioSelect;
