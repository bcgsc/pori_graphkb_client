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
import React from 'react';

export interface SelectOption<V = string> {
  key?: string;
  value: V;
  label?: string;
  caption?: string;
}

type SelectProps = React.ComponentProps<typeof Select>;

interface DropDownSelectProps<V extends string | null> {
  IconComponent?: SelectProps['IconComponent'];
  className?: string;
  disabled?: boolean;
  /** Error flag for input component. */
  error?: boolean;
  helperText?: string;
  innerProps?: SelectProps['inputProps'];
  /** Component label text. */
  label?: string;
  /** DOM node name property. */
  name?: string;
  /** Parent function to trigger on item select. */
  onChange?: (event: { target: { name: string; value: V } }) => void;
  /** List of options to be selected from. */
  options: (SelectOption<V> | V)[];
  /** Required flag for input component. */
  required?: boolean;
  /** Parent property to bind output data to. */
  value?: string | null;
  /** Material UI Select variant (outlined, filled, standard) */
  variant?: React.ComponentProps<typeof FormControl>['variant'];
}

/**
 * Component to select options from a list of defined options.
 */
function DropDownSelect<V extends string | null>(props: DropDownSelectProps<V>) {
  const {
    options,
    value,
    onChange,
    name,
    label,
    required,
    innerProps,
    error,
    helperText,
    variant,
    className,
    disabled,
    IconComponent,
  } = props;

  const optionsDisplay = options.map((option) => {
    const {
      key, value, label, caption,
    } = (typeof option === 'object' && option) ? option : { key: option, value: option, label: option || 'None' } as SelectOption;

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
            multiline: caption ? 'margin-reset' : '',
            root: caption ? 'margin-reset' : '',
          }}
          primary={label}
          secondary={caption || ''}
          secondaryTypographyProps={{ className: 'option-select__option-description' }}
        />
      </MenuItem>
    );
  });

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
      variant={variant}
    >
      <InputLabel
        htmlFor={`option-select-${name}`}
        required={required}
      >
        {label}
      </InputLabel>
      <Select
        IconComponent={disabled
          ? 'span'
          : IconComponent}
        input={<InputComponent id={`option-select-${name}`} name={name} />}
        inputProps={innerProps}
        onChange={onChange as SelectProps['onChange']}
        value={value || ''}
      >
        {optionsDisplay}
      </Select>
      <FormHelperText>{helperText}</FormHelperText>
    </FormControl>
  );
}

DropDownSelect.defaultProps = {
  onChange: null,
  name: '',
  label: '',
  required: false,
  error: false,
  variant: 'standard',
  className: '',
  disabled: false,
  helperText: '',
  innerProps: {},
  value: null,
  IconComponent: ArrowDropDownIcon,
};

export default DropDownSelect;
