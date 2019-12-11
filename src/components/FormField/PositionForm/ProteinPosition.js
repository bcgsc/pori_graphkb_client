import './index.scss';

import { schema } from '@bcgsc/knowledgebase-schema';
import {
  TextField,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';

import FieldWrapper from '../FieldWrapper';


const {
  schema: {
    ProteinPosition: { properties: { pos: posProperty, refAA: refAAProperty } },
    name: VARIANT,
  },
} = schema;


/**
 * Protein Position Input form
 *
 * @param {object} props
 * @param {function} props.onChange change handler
 * @param {object} props.value the initial value
 * @param {string} props.name the form field name to pass up to the change handler
 * @param {bool} props.required flag to indicate this field must be filled
 * @param {bool} props.disabled flag to indicate this field is disabled
 */
const ProteinPosition = ({
  onChange,
  value,
  name,
  required,
  disabled,
}) => {
  const { pos: initialPos, refAA: initialRefAA } = value || {};
  const [position, setPosition] = useState(initialPos);
  const [positionError, setPositionError] = useState('');
  const [refAA, setRefAA] = useState(initialRefAA);
  const [refAAError, setRefAAError] = useState('');

  // validate the position input
  useEffect(() => {
    if (!position && required && posProperty.mandatory) {
      setPositionError('missing required field');
    } else {
      try {
        posProperty.validate(position || null);
        setPositionError('');
      } catch (err) {
        setPositionError(err.toString());
      }
    }
  }, [position, required]);

  // validate the offset input
  useEffect(() => {
    if (!refAA && required && refAAProperty.mandatory) {
      setPositionError('missing required field');
    } else {
      try {
        refAAProperty.validate(refAA || null);
        setRefAAError('');
      } catch (err) {
        setRefAAError(err.toString());
      }
    }
  }, [refAA, required]);

  const handlePositionChange = useCallback(({ target: { value: newValue } }) => {
    setPosition(newValue);
    onChange({ target: { name, value: { '@class': VARIANT, pos: newValue, refAA } } });
  }, [onChange, name, refAA]);

  const handleRefAAChange = useCallback(({ target: { value: newValue } }) => {
    setRefAA(newValue);
    onChange({ target: { name, value: { '@class': VARIANT, refAA: newValue, pos: position } } });
  }, [onChange, name, position]);

  return (
    <>
      <FieldWrapper>
        <TextField
          className="position-form__refaa"
          disabled={disabled}
          error={Boolean(refAAError)}
          helperText={refAAError || ''}
          InputLabelProps={{ shrink: Boolean(refAA) }}
          inputProps={{ 'data-testid': `${name}.refAA` }}
          label="refAA"
          name="refAA"
          onChange={handleRefAAChange}
          required={required && refAAProperty.mandatory}
          value={refAA}
        />
      </FieldWrapper>
      <FieldWrapper>
        <TextField
          className="position-form__position"
          disabled={disabled}
          error={Boolean(positionError)}
          helperText={positionError || ''}
          InputLabelProps={{ shrink: Boolean(position) }}
          inputProps={{ 'data-testid': `${name}.pos` }}
          label="position"
          name="pos"
          onChange={handlePositionChange}
          required={required && posProperty.mandatory}
          value={position}
        />
      </FieldWrapper>
    </>
  );
};

ProteinPosition.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.shape({
    pos: PropTypes.number,
    refAA: PropTypes.string,
  }).isRequired,
  disabled: PropTypes.bool,
  name: PropTypes.string,
  required: PropTypes.bool,
};

ProteinPosition.defaultProps = {
  required: true,
  name: '',
  disabled: false,
};


export default ProteinPosition;
