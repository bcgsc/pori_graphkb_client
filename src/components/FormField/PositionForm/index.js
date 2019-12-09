import './index.scss';

import { schema } from '@bcgsc/knowledgebase-schema';
import {
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import ResourceSelect from '@/components/ResourceSelectComponent';

import BasicPosition from './BasicPosition';
import CytobandPosition from './CytobandPosition';
import ProteinPosition from './ProteinPosition';

/**
 * Handles the position form and toggle between range (for when the position in undertain)
 * and single value when the position is known
 *
 * @param {object} props
 * @param {function} props.variant the position type
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
  const positionVariants = schema.schema[baseVariant].descendantTree(true).map(m => m.name);
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
      <ResourceSelect
        disabled={disabled}
        onChange={handleVariantChange}
        resources={positionVariants}
        value={variant}
      />
      )}
      {variant && (
      <PositionComponent
        disabled={disabled}
        name={name}
        onChange={onChange}
        value={value}
        variant={variant}
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
  baseVariant: 'Position',
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
