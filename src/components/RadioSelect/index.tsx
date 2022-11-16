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
import React, { ReactNode } from 'react';

import { SelectOption } from '../DropDownSelect';

interface RadioSelectProps {
  /** the options to display */
  options: (SelectOption | string)[];
  /** css class name to add to the top-level component */
  className?: string;
  /** optional label for the field */
  label?: string;
  /** the name to use for the input and reporting change to the parent handler */
  name?: string;
  /** the change handler to report the selection back to the parent */
  onChange: (arg: { target: { name?: string; value: string } }) => void;
  /** the function to generate a key from a selection value */
  optionToKey?: (option: Option | string) => string;
  /** the current value */
  value?: string;
}

/**
 * Select from a list of radio button options
 *
 * Add captions below choices when provided
 */
const RadioSelect = ({
  options, onChange, className, label, value, optionToKey, name,
}: RadioSelectProps) => (
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

RadioSelect.defaultProps = {
  label: '',
  name: '',
  onChange: () => {},
  className: '',
  value: null,
  optionToKey: (o) => o.key || o,
};

export default RadioSelect;
