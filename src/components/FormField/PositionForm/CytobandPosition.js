import './index.scss';

import { schema } from '@bcgsc-pori/graphkb-schema';
import {
  TextField,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';

import useSchemaForm from '@/components/hooks/useSchemaForm';

import FieldWrapper from '../FieldWrapper';


const {
  schema: {
    CytobandPosition: {
      properties,
      properties: { arm, majorBand, minorBand }, name: VARIANT,
    },
  },
} = schema;


/**
 * Cytoband position form
 *
 * @param {object} props
 * @param {function} props.onChange change handler
 * @param {object} props.value the initial value
 * @param {string} props.name the form field name to pass up to the change handler
 * @param {bool} props.required flag to indicate this field must be filled
 * @param {bool} props.disabled flag to indicate this field is disabled
 */
const CytobandPosition = ({
  onChange,
  value,
  name,
  required,
  disabled,
}) => {
  const { formContent, formErrors, updateField } = useSchemaForm(
    properties,
    { ...(value || {}), '@class': VARIANT },
  );

  useDeepCompareEffect(() => {
    onChange({ target: { name, value: formContent } });
  }, [formContent]);

  const handleUpdate = useCallback(({ target: { name: eventName, value: eventValue } }) => {
    updateField(eventName, eventValue);
  }, [updateField]);

  return (
    <>
      {[arm, majorBand, minorBand].map(model => (
        <FieldWrapper key={model.name}>
          <TextField
            disabled={disabled}
            error={Boolean(formErrors[model.name])}
            helperText={(formErrors[model.name] && formErrors[model.name].message) || ''}
            InputLabelProps={{ shrink: Boolean(formContent[model.name]) }}
            inputProps={{ 'data-testid': `${name}.${model.name}` }}
            label={model.name}
            name={model.name}
            onChange={handleUpdate}
            required={required && model.mandatory}
            value={formContent[model.name]}
          />
        </FieldWrapper>
      ))}
    </>
  );
};

CytobandPosition.propTypes = {
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  name: PropTypes.string,
  required: PropTypes.bool,
  value: PropTypes.object,
};

CytobandPosition.defaultProps = {
  required: true,
  value: {},
  name: '',
  disabled: false,
};


export default CytobandPosition;
