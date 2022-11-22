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
} from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import React, { ReactNode } from 'react';

import { GeneralRecordType } from '@/components/types';

interface SelectOption {
  key?: string;
  value?: string;
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
        secondaryTypographyProps={{ className: 'option-select__option-description' }}
      />
    </MenuItem>
  );
};

type SelectProps = React.ComponentProps<typeof Select>;

interface DropDownSelectProps {
  IconComponent?: SelectProps['IconComponent'];
  /** Function to produce list items. */
  children?: (option: SelectOption | string, disabled: boolean | undefined) => ReactNode;
  className?: string;
  /** Flag for dense variant, which has smaller font size. */
  dense?: boolean;
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
  onChange?: (...args: unknown[]) => unknown;
  /** List of options to be selected from. */
  options?: (SelectOption | string)[];
  /** Required flag for input component. */
  required?: boolean;
  /** Parent property to bind output data to. */
  value?: GeneralRecordType | string;
  /** Material UI Select variant (outlined, filled, standard) */
  variant?: React.ComponentProps<typeof FormControl>['variant'];
}

/**
 * Component to select options from a list of defined options.
 */
function DropDownSelect(props: DropDownSelectProps) {
  const {
    options,
    value,
    onChange,
    name,
    label,
    children,
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
