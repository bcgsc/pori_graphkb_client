import './index.scss';

import { schema } from '@bcgsc-pori/graphkb-schema';
import {
  TextField,
} from '@material-ui/core';
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

interface CytobandPositionProps {
  /** change handler */
  onChange: (arg: { target: { name?: string; value: unknown } }) => void;
  /** flag to indicate this field is disabled */
  disabled?: boolean;
  /** the form field name to pass up to the change handler */
  name?: string;
  /** flag to indicate this field must be filled */
  required?: boolean;
  /** the initial value */
  value?: unknown;
}

/**
 * Cytoband position form
 */
const CytobandPosition = ({
  onChange,
  value,
  name,
  required,
  disabled,
}: CytobandPositionProps) => {
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
      {[arm, majorBand, minorBand].map((model) => (
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

CytobandPosition.defaultProps = {
  required: true,
  value: {},
  name: '',
  disabled: false,
};

export default CytobandPosition;
