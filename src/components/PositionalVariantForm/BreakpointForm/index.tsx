import {
  Checkbox,
  FormControlLabel,
  Stack,
} from '@mui/material';
import React, { ReactNode, useCallback, useState } from 'react';

import { useFormContext } from '@/components/FormContext';
import FormField from '@/components/FormField';

interface BreakpointFormProps {
  /** the Position class */
  coordinateType: string;
  /** the field name of the reference element (ex. reference1) */
  reference: string;
  /** the field name of the end position (ex. break1End) */
  end: string;
  /** the field name of the start position (ex. break1Start) */
  start: string;
  label?: ReactNode;
}

/**
 * Handles the form for a single breakpoint (start and end) with the reference element it is
 * associated with
 *
 * Used for inputting positional variants
 */
const BreakpointForm = ({
  coordinateType, reference, start, end, label,
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
      <FormField
        label="reference"
        name={reference}
      />
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
        name={start}
      />
      {uncertain && (
        <FormField
          baseModel={coordinateType}
          label={`end (${coordinateType})`}
          name={end}
        />
      )}
    </Stack>
  );
};

export default BreakpointForm;
