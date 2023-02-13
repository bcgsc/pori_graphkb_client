/**
 * RadioList based selection
 */
import './index.scss';

import {
  ListItemText,
  MenuItem,
  MenuList,
  Radio,
} from '@material-ui/core';
import React from 'react';

import { SelectOption } from '../DropDownSelect';

const optionToKey = (o) => o.key || o;

interface RadioSelectProps {
  /** the options to display */
  options: (SelectOption | string)[];
  /** css class name to add to the top-level component */
  className?: string;
  /** the change handler to report the selection back to the parent */
  onChange: (arg: { target: { name?: string; value: string } }) => void;
  /** the current value */
  value?: string;
}

/**
 * Select from a list of radio button options
 *
 * Add captions below choices when provided
 */
function RadioSelect({
  options, onChange, className, value,
}: RadioSelectProps) {
  return (
    <MenuList className={`radio-select ${className}`}>
      {options.map((option) => {
        const optionValue = option.value === undefined ? option : option.value;
        const checked = Boolean(value === optionValue);
        return (
          <MenuItem
            key={optionToKey(option)}
            className="radio-option"
            onClick={() => {
              onChange({ target: { name: '', value: optionValue } });
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
  className: '',
  value: null,
};

export default RadioSelect;
