import './index.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import CancelIcon from '@mui/icons-material/Cancel';
import {
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
} from '@mui/material';
import React, { useState } from 'react';

import DropDownSelect from '@/components/DropDownSelect';

import { BaseFormFieldProps } from '../types';
import BasicPosition from './BasicPosition';
import CytobandPosition from './CytobandPosition';
import ProteinPosition from './ProteinPosition';

const DEFAULT_BASE_VARIANT = 'Position';

interface PositionFormProps extends BaseFormFieldProps<Record<string, unknown> | null> {
  baseVariant?: string;
  /** can this position be removed/deleted/set to null */
  clearable?: boolean;
  /** the position class model name */
  variant?: string;
}

const PositionForm = ({
  baseVariant = DEFAULT_BASE_VARIANT,
  clearable = true,
  disabled = false,
  error = false,
  errorText,
  helperText = '',
  label = '',
  name,
  onChange,
  required = false,
  value,
  variant: initialVariant = '',
  ...props
}: PositionFormProps) => {
  const positionVariants = schemaDefn.descendants(baseVariant || DEFAULT_BASE_VARIANT, { excludeAbstract: true, includeSelf: true });
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
            onChange?.({ target: { name, value: null } });
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
      <FormHelperText error={error}>{errorText || helperText}</FormHelperText>
    </FormControl>
  );
};

export default PositionForm;
