import './index.scss';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
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
  /** the form field name to pass up to the change handler */
  name: string;
  /** change handler */
  onChange: (event: { target: { name: string; value: unknown } }) => void;
  baseVariant: string | undefined;
  /** flag to indicate this field is disabled */
  disabled: boolean;
  /** indicates there is an outstanding error */
  error: boolean;
  /** text to be displayed below the input field */
  helperText: string | undefined;
  /**  label to display above the field */
  label: string;
  /** flag to indicate this field must be filled */
  required?: boolean;
  /** the initial value */
  value: unknown;
  /** the position class model name */
  variant: string | undefined;
}

const PositionForm = ({
  baseVariant = DEFAULT_BASE_VARIANT,
  disabled,
  error,
  helperText = '',
  label,
  name,
  onChange,
  required,
  value,
  variant: initialVariant = '',
}: PositionFormProps) => {
  const positionVariants = schemaDefn.schema[baseVariant || DEFAULT_BASE_VARIANT]
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
      {!disabled && variant && (
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
        />
      )}
      <FormHelperText error={error}>{helperText}</FormHelperText>
    </FormControl>
  );
};

PositionForm.defaultProps = {
  required: false,
};

export default PositionForm;
