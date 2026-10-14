import './index.scss';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  ListItemText,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import React from 'react';

interface SelectOption {
  key?: string;
  value?: string | null;
  label?: string;
  caption?: string;
}

const DefaultOptionComponent = (option, disabled) => {
  const key = option.key === undefined
    ? option
    : option.key;

  const value = option.value === undefined
    ? option
    : option.value;

  const label = option.label === undefined
    ? option || 'None'
    : option.label;

  return (
    <MenuItem
      key={key}
      className="option-select__option"
      component="li"
      value={value}
    >
      <ListItemText
        classes={{
          primary: disabled ? 'disabled-text' : '',
          multiline: option.caption ? 'margin-reset' : '',
          root: option.caption ? 'margin-reset' : '',
        }}
        primary={label}
        secondary={option.caption || ''}
        slotProps={{
          secondary: { className: 'option-select__option-description' },
        }}
      />
    </MenuItem>
  );
};

type SelectProps = React.ComponentProps<typeof Select>;

interface DropDownSelectProps {
  IconComponent?: SelectProps['IconComponent'];
  className?: string;
  disabled?: boolean;
  /** Error flag for input component. */
  error?: boolean;
  helperText?: string;
  /** CSS selector id for root component. */
  id?: string;
  innerProps?: SelectProps['inputProps'];
  /** Component label text. */
  label?: string;
  /** DOM node name property. */
  name?: string;
  /** Parent function to trigger on item select. */
  onChange?: (e: { target: { name: string; value: string } }) => void;
  /** List of options to be selected from. */
  options?: (SelectOption | string)[];
  /** Required flag for input component. */
  required?: boolean;
  /** Parent property to bind output data to. */
  value?: string;
  readOnly?: boolean;
}

/**
 * Component to select options from a list of defined options.
 */
function DropDownSelect(props: DropDownSelectProps) {
  const {
    options = [],
    value,
    onChange,
    name,
    label = '',
    required = false,
    id: idProp,
    innerProps = {},
    error = false,
    helperText = '',
    className = '',
    disabled = false,
    IconComponent = ArrowDropDownIcon,
    readOnly,
  } = props;

  const id = idProp;
  const optionsDisplay = options.map((option) => DefaultOptionComponent(option, disabled));

  return (
    <TextField
      className={`option-select ${className}`}
      disabled={disabled}
      error={error}
      helperText={helperText}
      id={id}
      label={label}
      name={name}
      onChange={!readOnly ? onChange : undefined}
      required={required}
      select
      slotProps={{
        select: {
          IconComponent: readOnly
            ? 'span'
            : IconComponent,
          disableUnderline: readOnly,
          readOnly,
        },
        htmlInput: innerProps,
      }}
      value={value || ''}
    >{optionsDisplay}
    </TextField>
  );
}

export default DropDownSelect;
