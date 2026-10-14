import {
  Checkbox,
  FormControlLabel,
  Stack,
} from '@mui/material';
import React, { ReactNode, useCallback } from 'react';

import { useFormContext } from '@/components/FormContext';
import FormField from '@/components/FormField';

interface BreakpointFormProps {
  /** the Position class */
  coordinateType: string;
  breakpoint: '1' | '2';
  label?: ReactNode;
  readOnly: boolean;
}

/**
 * Handles the form for a single breakpoint (start and end) with the reference element it is
 * associated with
 *
 * Used for inputting positional variants
 */
const BreakpointForm = ({
  coordinateType, breakpoint, label, readOnly,
}: BreakpointFormProps) => {
  const { formContent, update } = useFormContext();
  const uncertain = Boolean(formContent[`break${breakpoint}End`]);

  const handleCheckUncertain = useCallback((checked) => {
    if (!checked) {
      // unchecking
      update({ [`break${breakpoint}End`]: null });
    } else {
      update({ [`break${breakpoint}End.@class`]: coordinateType });
    }
  }, [breakpoint, coordinateType, update]);

  return (
    <Stack spacing={2}>
      {label}
      <FormField
        label="reference"
        name={`reference${breakpoint}`}
      />
      {!readOnly && (
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

      )}
      <FormField
        defaultLinkedClass={coordinateType}
        label={`${uncertain ? 'start' : 'position'} (${coordinateType})`}
        name={`break${breakpoint}Start`}
      />
      {uncertain && (
        <FormField
          defaultLinkedClass={coordinateType}
          label={`end (${coordinateType})`}
          name={`break${breakpoint}End`}
        />
      )}
    </Stack>
  );
};

export default BreakpointForm;
