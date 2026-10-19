import {
  Checkbox,
  FormControlLabel,
  Stack,
} from '@mui/material';
import React, { ReactNode, useCallback } from 'react';

import FormField from '@/components/FormField';
import { shouldHideField, useFormContext } from '@/components/hooks/useSchemaForm';

interface BreakpointFormProps {
  /** the Position class */
  coordinateType: string;
  breakpoint: '1' | '2';
  readOnly: boolean;
}

/**
 * Handles the form for a single breakpoint (start and end) with the reference element it is
 * associated with
 *
 * Used for inputting positional variants
 */
const BreakpointForm = ({
  coordinateType, breakpoint, readOnly,
}: BreakpointFormProps) => {
  const form = useFormContext();
  const reference = `reference${breakpoint}`;
  const start = `break${breakpoint}Start`;
  const end = `break${breakpoint}End`;
  const uncertain = Boolean(form.content[end]);
  const { update } = form;

  const shouldHide = (name: string) => shouldHideField(form.variant, form.model.properties[name], form.content[name]);

  const handleCheckUncertain = useCallback((checked) => {
    if (!checked) {
      // unchecking
      update({ [end]: null });
    } else {
      update({ [`${end}.@class`]: coordinateType });
    }
  }, [end, coordinateType, update]);

  const hide = Object.fromEntries([reference, start, end].map((name) => [name, shouldHide(name)]));

  let label = 'Breakpoint';

  if (breakpoint === '1' && !shouldHide('break2Start')) {
    label = 'First Breakpoint';
  } else if (breakpoint === '2') {
    label = 'Second Breakpoint';
  }

  if (hide[reference] && hide[start] && hide[end]) {
    return null;
  }

  return (
    <Stack spacing={2}>
      {label}
      {!hide[reference] && (
        <FormField name={reference} />
      )}
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
      {!hide[start] && (
        <FormField
          defaultLinkedClass={coordinateType}
          label={`${uncertain ? 'start' : 'position'} (${coordinateType})`}
          name={start}
        />
      )}
      {uncertain && !hide[end] && (
        <FormField
          defaultLinkedClass={coordinateType}
          label={`end (${coordinateType})`}
          name={end}
        />
      )}
    </Stack>
  );
};

export default BreakpointForm;
