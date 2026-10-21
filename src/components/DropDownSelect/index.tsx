import './index.scss';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  ListItemText,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import React, { ReactNode } from 'react';

interface SelectOption {
  key?: string;
  value?: string | null;
  label?: string;
  caption?: string;
}

function getOption(option: SelectOption | string): SelectOption {
  if (typeof option === 'string') {
    return { value: option, label: option, key: option };
  }
  return option;
}

const getOptionNode = (props: { key: string; disabled: boolean; } & SelectOption): ReactNode => {
  const {
    key, value, label, caption, disabled,
  } = props;

  return (
    <MenuItem
      key={key}
      className="option-select__option"
      component="li"
      value={value as string}
    >
      <ListItemText
        classes={{
          primary: disabled ? 'disabled-text' : '',
          multiline: caption ? 'margin-reset' : '',
          root: caption ? 'margin-reset' : '',
        }}
        primary={label}
        secondary={caption || ''}
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
  'aria-label'?: string;
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
    disabled: disabledProp = false,
    IconComponent = ArrowDropDownIcon,
    readOnly,
    'aria-label': ariaLabel,
  } = props;
  const disabled = disabledProp && !readOnly;

  const id = idProp;
  let valueIsOption = false;
  const optionsDisplay: ReactNode[] = [];
  options.forEach((option) => {
    const opt = getOption(option);

    if (opt.value === value) {
      valueIsOption = true;
    }
    optionsDisplay.push(
      getOptionNode({
        key: opt.key ?? String(opt.value),
        caption: opt.caption,
        disabled,
        label: opt.label,
        value: opt.value,
      }),
    );
  });

  // show the invalid value if readOnly
  if (readOnly && !valueIsOption && value) {
    optionsDisplay.push(getOptionNode({
      key: '_invalid_option', disabled, label: value, value,
    }));
  }

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
        htmlInput: { 'aria-label': ariaLabel, ...innerProps },
      }}
      value={value || ''}
    >{optionsDisplay}
    </TextField>
  );
}

export default DropDownSelect;
