import './index.scss';

import { schema } from '@bcgsc-pori/graphkb-schema';
import {
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import DropDownSelect from '@/components/DropDownSelect';

import BasicPosition from './BasicPosition';
import CytobandPosition from './CytobandPosition';
import ProteinPosition from './ProteinPosition';

const DEFAULT_BASE_VARIANT = 'Position';

/**
 * @param {object} props
 * @param {function} props.onChange change handler
 * @param {bool} props.clearable can this position be removed/deleted/set to null
 * @param {bool} props.disabled flag to indicate this field is disabled
 * @param {bool} props.error indicates there is an outstanding error
 * @param {string} props.helperText text to be displayed below the input field
 * @param {string} props.label label to display above the field
 * @param {object} props.value the initial value
 * @param {string} props.name the form field name to pass up to the change handler
 * @param {bool} props.required flag to indicate this field must be filled
 * @param {string} props.variant the position class model name
 */
const PositionForm = ({
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
}) => {
  const positionVariants = schema.schema[baseVariant || DEFAULT_BASE_VARIANT]
    .descendantTree(true).map(m => m.name);
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
};

PositionForm.propTypes = {
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  baseVariant: PropTypes.string,
  clearable: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool,
  value: PropTypes.object,
  variant: PropTypes.string,
};

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
