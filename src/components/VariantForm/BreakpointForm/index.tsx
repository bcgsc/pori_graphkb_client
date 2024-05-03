import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import {
  Checkbox,
  FormControlLabel,
} from '@material-ui/core';
import React, { useCallback, useContext, useState } from 'react';

import FormContext from '@/components/FormContext';
import FormField from '@/components/FormField';

interface BreakpointFormProps{
  /** the Position class */
  coordinateType: string;
  /**
   * @todo get type from schema package
   */
  model: any;
  /** the field name of the reference element (ex. reference1) */
  reference: string;
  /** the field name of the end position (ex. break1End) */
  end?: string;
  /** flag to indicate this field is required */
  required?: boolean;
  /** the field name of the start position (ex. break1Start) */
  start?: string;
}

/**
 * Handles the form for a single breakpoint (start and end) with the reference element it is
 * associated with
 *
 * Used for inputting positional variants
 */
const BreakpointForm = ({
  coordinateType, reference, start, end, required, model,
}: BreakpointFormProps) => {
  const { formContent, updateField } = useContext(FormContext);
  const [uncertain, setUncertain] = useState(Boolean(formContent[end]));

  const handleCheckUncertain = useCallback((checked) => {
    if (!checked) {
      // unchecking
      updateField(end, null);
    }
    setUncertain(checked);
  }, [end, updateField]);

  return (
    <div className="breakpoint-form">
      {reference && (
        <FormField
          initialFilterClass="Feature"
          label="reference"
          model={{ ...schemaDefn.getProperty(model.name, 'reference1'), required, name: reference }}
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
            clearable={false}
            label={`${uncertain ? 'start' : 'position'} (${coordinateType})`}
            model={{
              ...schemaDefn.getProperty(model.name, 'break1Start'),
              name: start,
              mandatory: required,
              linkedClass: schemaDefn.get(coordinateType),
              description: '',
            }}
          />
          {uncertain && (
            <FormField
              baseModel={coordinateType}
              clearable={false}
              label={`end (${coordinateType})`}
              model={{
                ...schemaDefn.getProperty(model.name, 'break1End'),
                name: end,
                mandatory: required,
                linkedClass: schemaDefn.get(coordinateType),
                description: 'end of the breakpoint range',
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

BreakpointForm.defaultProps = {
  required: true,
  start: '',
  end: '',
};

export default BreakpointForm;
