import './index.scss';

import { schema } from '@bcgsc-pori/graphkb-schema';
import {
  TextField,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';

import FieldWrapper from '../FieldWrapper';


const {
  schema: {
    GenomicPosition: { properties: { pos: posProperty } },
    CdsPosition: { properties: { offset: offsetProperty } },
  },
} = schema;


/**
 * Basic Position and Position with offset form
 *
 * @param {object} props
 *
 * @param {function} props.onChange change handler
 * @param {string} props.variant the class model to use to build the form
 * @param {object} props.value the initial value
 * @param {string} props.name the form field name to pass up to the change handler
 * @param {bool} props.required flag to indicate this field must be filled
 * @param {bool} props.disabled flag to indicate this field is disabled
 */
const BasicPositionForm = ({
  onChange,
  variant,
  value,
  name,
  required,
  disabled,
}) => {
  const { pos: initialPos, offset: initialOffset } = value || {};
  const [position, setPosition] = useState(initialPos);
  const [positionError, setPositionError] = useState('');
  const [offset, setOffset] = useState(initialOffset);
  const [offsetError, setOffsetError] = useState('');

  // validate the position input
  useEffect(() => {
    if (!position && required && posProperty.mandatory) {
      setPositionError('missing required property');
    } else {
      try {
        posProperty.validate(position);
        setPositionError('');
      } catch (err) {
        setPositionError(err.toString());
      }
    }
  }, [position, required]);

  // validate the offset input
  useEffect(() => {
    if (!offset && offset !== 0) {
      if (required && offsetProperty.mandatory) {
        setOffsetError('missing required property');
      } else {
        setOffsetError('');
      }
    } else {
      try {
        offsetProperty.validate(offset);
        setOffsetError('');
      } catch (err) {
        setOffsetError(err.toString());
      }
    }
  }, [offset, required]);

  const handlePositionChange = useCallback(({ target: { value: newValue } }) => {
    setPosition(newValue);
    onChange({ target: { name, value: { '@class': variant, pos: newValue, offset } } });
  }, [onChange, name, variant, offset]);

  const handleOffsetChange = useCallback(({ target: { value: newValue } }) => {
    setOffset(newValue);
    onChange({ target: { name, value: { '@class': variant, offset: newValue, pos: position } } });
  }, [onChange, name, variant, position]);

  const isOffsetVariant = Boolean(schema.get(variant).properties.offset);


  return (
    <>
      <FieldWrapper>
        <TextField
          className="position-form__position form-field"
          disabled={disabled}
          error={Boolean(positionError)}
          helperText={positionError || ''}
          InputLabelProps={{ shrink: !!position }}
          inputProps={{ 'data-testid': `${name}.pos` }}
          label="position"
          name="pos"
          onChange={handlePositionChange}
          required={required}
          value={position}
        />
      </FieldWrapper>
      {isOffsetVariant && (
        <FieldWrapper>
          <TextField
            className="position-form__offset form-field"
            disabled={disabled}
            error={Boolean(offsetError)}
            helperText={offsetError || ''}
            InputLabelProps={{ shrink: offset !== '' }}
            inputProps={{ 'data-testid': `${name}.offset` }}
            label="offset"
            name="offset"
            onChange={handleOffsetChange}
            required={required}
            value={offset}
          />
        </FieldWrapper>
      )}
    </>
  );
};

BasicPositionForm.propTypes = {
  onChange: PropTypes.func.isRequired,
  variant: PropTypes.oneOf([
    'GenomicPosition',
    'ExonicPosition',
    'IntronicPosition',
    'RnaPosition',
    'CdsPosition',
  ]).isRequired,
  disabled: PropTypes.bool,
  name: PropTypes.string,
  required: PropTypes.bool,
  value: PropTypes.shape({
    pos: PropTypes.number,
    offset: PropTypes.number,
  }),
};

BasicPositionForm.defaultProps = {
  required: true,
  name: '',
  disabled: false,
  value: null,
};


export default BasicPositionForm;
