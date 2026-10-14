import {
  Checkbox,
  FormControlLabel,
  Stack,
} from '@mui/material';
import React, { ReactNode, useCallback, useState } from 'react';

import { useFormContext } from '@/components/FormContext';
import FormField from '@/components/FormField';
import { SchemaClassDefinition } from '@/services/schema';

interface BreakpointFormProps {
  /** the Position class */
  coordinateType: string;
  model: Pick<SchemaClassDefinition, 'name' | 'properties'>;
  /** the field name of the reference element (ex. reference1) */
  reference: string | undefined;
  /** the field name of the end position (ex. break1End) */
  end?: string;
  /** flag to indicate this field is required */
  required?: boolean;
  /** the field name of the start position (ex. break1Start) */
  start?: string;
  label?: ReactNode;
}

/**
 * Handles the form for a single breakpoint (start and end) with the reference element it is
 * associated with
 *
 * Used for inputting positional variants
 */
const BreakpointForm = ({
  coordinateType, reference, start = '', end = '', required = true, model, label,
}: BreakpointFormProps) => {
  const { formContent, updateField } = useFormContext();
  const [uncertain, setUncertain] = useState(Boolean(formContent[end]));

  const handleCheckUncertain = useCallback((checked) => {
    if (!checked) {
      // unchecking
      updateField(end, null);
    }
    setUncertain(checked);
  }, [end, updateField]);

  return (
    <Stack spacing={2}>
      {label}
      {reference && (
        <FormField
          label="reference"
          model={{ ...model.properties.reference1, mandatory: required, name: reference }}
        />
      )}
      {start && (
        <>
          <FormControlLabel
            className="breakpoint-form__uncertain-checkbox"
            control={(
              <Checkbox
                checked={uncertain}
                data-testid="breakpoint-form__uncertain-checkbox"
                onChange={() => handleCheckUncertain(!uncertain)}
              />
            )}
            label="uncertain position"
          />
          <FormField
            baseModel={coordinateType}
            label={`${uncertain ? 'start' : 'position'} (${coordinateType})`}
            model={{
              ...model.properties.break1Start,
              name: start,
              mandatory: required,
              linkedClass: coordinateType,
              description: '',
            }}
          />
          {uncertain && (
            <FormField
              baseModel={coordinateType}
              label={`end (${coordinateType})`}
              model={{
                ...model.properties.break1End,
                name: end,
                mandatory: required,
                linkedClass: coordinateType,
                description: 'end of the breakpoint range',
              }}
            />
          )}
        </>
      )}
    </Stack>
  );
};

export default BreakpointForm;
