import './index.scss';

import { schema } from '@bcgsc-pori/graphkb-schema';
import {
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import React, { useState } from 'react';

import DropDownSelect from '@/components/DropDownSelect';

import BasicPosition from './BasicPosition';
import CytobandPosition from './CytobandPosition';
import ProteinPosition from './ProteinPosition';

const DEFAULT_BASE_VARIANT = 'Position';

interface PositionFormProps {
  name: string;
  /** change handler */
  onChange: (e: { target: { name: string, value: null | object } }) => void;
  /**
   * @default 'Position'
   */
  baseVariant?: string;
  /**
   * can this position be removed/deleted/set to null
   * @default true
   */
  clearable?: boolean;
  /** flag to indicate this field is disabled */
  disabled?: boolean;
  /** indicates there is an outstanding error */
  error?: boolean;
  /** text to be displayed below the input field */
  helperText?: string;
  /** label to display above the field */
  label?: string;
  /** flag to indicate this field must be filled */
  required?: boolean;
  /** the initial value */
  value?: object;
  /** the position class model name */
  variant?: string;
}

function PositionForm({
  baseVariant,
  clearable,
  disabled,
  error,
  helperText,
  label,
  name,
  onChange,
  required,
  value,
  variant: initialVariant,
  ...props
}: PositionFormProps) {
  const positionVariants = schema.schema[baseVariant || DEFAULT_BASE_VARIANT]
    .descendantTree(true).map((m) => m.name);
  const [variant, setVariant] = useState(initialVariant);

  let PositionComponent;

  if (variant === 'CytobandPosition') {
    PositionComponent = CytobandPosition;
  } else if (variant === 'ProteinPosition') {
    PositionComponent = ProteinPosition;
  } else {
    PositionComponent = BasicPosition;
  }

  const handleVariantChange = ({ target: { value: newVariant } }) => {
    setVariant(newVariant);
  };

  if (!variant && disabled) {
    return null;
  }

  return (
    <FormControl className="position-form" component="ul">
      {label && (
        <FormLabel disabled={disabled} error={error} required={required}>{label}</FormLabel>
      )}
      {!disabled && clearable && variant && (
        <IconButton
          className="position-form__cancel"
          onClick={() => {
            onChange({ target: { name, value: null } });
            setVariant('');
          }}
        >
          <CancelIcon />
        </IconButton>
      )}
      {positionVariants.length > 1 && (
      <DropDownSelect
        disabled={disabled}
        onChange={handleVariantChange}
        options={positionVariants}
        value={variant}
      />
      )}
      {(variant || positionVariants.length === 1) && (
      <PositionComponent
        disabled={disabled}
        name={name}
        onChange={onChange}
        value={value}
        variant={variant || positionVariants[0]}
        {...props}
      />
      )}
      <FormHelperText error={error}>{helperText}</FormHelperText>
    </FormControl>
  );
}

PositionForm.defaultProps = {
  baseVariant: DEFAULT_BASE_VARIANT,
  clearable: true,
  disabled: false,
  error: false,
  helperText: '',
  label: '',
  required: false,
  value: null,
  variant: '',
};

export default PositionForm;
