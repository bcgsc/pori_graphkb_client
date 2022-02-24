/**
 * @module /components/DropDownSelect
 */
import './index.scss';

import {
  FilledInput,
  FormControl,
  FormHelperText,
  Input,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  SelectProps,
  TextFieldProps,
} from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import React, { ReactNode } from 'react';

import { GeneralRecordType } from '@/components/types';

interface SelectOptionType {
  key?: string;
  value?: string;
  label?: string;
  caption?: string;
}

function DefaultOptionComponent(option: SelectOptionType | string, disabled: boolean | undefined) {
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
        secondaryTypographyProps={{ className: 'option-select__option-description' }}
      />
    </MenuItem>
  );
}

interface DropDownSelectProps {
  /** List of options to be selected from. */
  options?: (SelectOptionType | string)[];
  /** Parent property to bind output data to. */
  value?: GeneralRecordType | string;
  /** Parent function to trigger on item select. */
  onChange?: () => void;
  /** DOM node name property. */
  name?: string;
  /** Component label text. */
  label?: string;
  /** Function to produce list items. */
  children?: (option: any, disabled: boolean | undefined) => ReactNode;
  /** Required flag for input component. */
  required?: boolean;
  /** Error flag for input component. */
  error?: boolean;
  /** CSS selector id for root component. */
  id?: string;
  /** Flag for dense variant, which has smaller font
 * size. */
  dense?: boolean;
  /** Material UI Select variant (outlined, filled, standard) */
  variant?: TextFieldProps['variant'];
  IconComponent?: SelectProps['IconComponent'];
  className?: string;
  helperText?: string;
  disabled?: boolean;
  innerProps?: SelectProps['inputProps'];
}

/**
 * Component to select options from a list of defined options.
 * @param {Object} props - Properties passed in by parent component.
 */
function DropDownSelect(props: DropDownSelectProps) {
  const {
    options = [],
    value,
    onChange,
    name,
    label,
    children = DefaultOptionComponent,
    required,
    id,
    innerProps,
    error,
    helperText,
    dense,
    variant,
    className,
    disabled,
    IconComponent,
  } = props;

  const optionsDisplay = options.map((option) => children(option, disabled));

  let InputComponent = Input;

  if (variant === 'outlined') {
    InputComponent = OutlinedInput;
  }
  if (variant === 'filled') {
    InputComponent = FilledInput;
  }
  return (
    <FormControl
      className={`option-select ${className}`}
      disabled={disabled}
      error={error}
      id={id}
      variant={variant}
    >
      <InputLabel
        htmlFor={`option-select-${name}`}
        required={required}
        style={{
          fontSize: dense ? '0.8125rem' : '',
        }}
      >
        {label}
      </InputLabel>
      <Select
        IconComponent={disabled
          ? 'span'
          : IconComponent}
        input={<InputComponent id={`option-select-${name}`} name={name} />}
        inputProps={innerProps}
        onChange={onChange}
        style={{
          fontSize: dense ? '0.8125rem' : '',
        }}
        value={value || ''}
      >
        {optionsDisplay}
      </Select>
      <FormHelperText>{helperText}</FormHelperText>
    </FormControl>
  );
}

DropDownSelect.defaultProps = {
  children: DefaultOptionComponent,
  options: [],
  onChange: null,
  name: '',
  label: '',
  required: false,
  error: false,
  id: undefined,
  dense: false,
  variant: 'standard',
  className: '',
  disabled: false,
  helperText: '',
  innerProps: {},
  value: null,
  IconComponent: ArrowDropDownIcon,
};

export default DropDownSelect;
