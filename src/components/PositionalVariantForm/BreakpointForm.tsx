/* eslint-disable react/jsx-props-no-spreading */
import './BreakpointForm.scss';

import {
  Box,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import React, { useCallback } from 'react';

import FormField, { useFormField } from '@/components/FormField';
import { useFormContext } from '@/components/hooks/useSchemaForm';

import EmbeddedForm from '../FormField/EmbeddedForm';
import { FORM_VARIANT } from '../util';

function BreakpointsForm({ coordinateType }: { coordinateType: string }) {
  const form = useFormContext();
  const { update } = form;

  const getStartLabel = (breakpoint: number) => {
    if (form.variant !== FORM_VARIANT.VIEW) {
      // return `position/start (${coordinateType})`;
    }
    return `${form.content[`break${breakpoint}End`] ? 'start' : 'position'} (${coordinateType})`;
  };

  const break1Start = useFormField('break1Start', { label: getStartLabel(1) });
  const break1End = useFormField('break1End', { label: `end (${coordinateType})` });
  const break2Start = useFormField('break2Start', { label: getStartLabel(2) });
  const break2End = useFormField('break2End', { label: `end (${coordinateType})` });
  const reference2 = useFormField('reference2');

  const uncertain = {
    1: Boolean(form.content.break1End),
    2: Boolean(form.content.break2End),
  };

  const handleCheckUncertain = useCallback((breakpoint: number, checked) => {
    if (!checked) {
      // unchecking
      update({ [`break${breakpoint}End`]: null });
    } else {
      update({ [`break${breakpoint}End.@class`]: coordinateType });
    }
  }, [coordinateType, update]);

  const showBreak2 = !break2Start.hide || !break2End.hide || !reference2.hide;

  return (
    <Box
      className="breakpoints-form"
    >
      {reference2.hide ? <FormField name="reference1" /> : null}
      <div className="column">
        <div>{showBreak2 ? 'First Breakpoint' : 'Breakpoint'}</div>
        {!reference2.hide && <FormField name="reference1" />}
        {form.variant !== FORM_VARIANT.VIEW && (
          <FormControlLabel
            control={(
              <Checkbox
                checked={uncertain[1]}
                onChange={() => handleCheckUncertain(1, !uncertain[1])}
              />
            )}
            disabled={form.disabled}
            label="uncertain position"
          />
        )}
        <EmbeddedForm
          {...break1Start.props}
          defaultLinkedClass={coordinateType}
        />
        {Boolean(break1End.value) && (
          <EmbeddedForm
            {...break1End.props}
            defaultLinkedClass={coordinateType}
            required
          />
        )}
      </div>
      {showBreak2 && (
        <div className="column">
          <div id="break2">Second Breakpoint</div>
          {!reference2.hide && <FormField name="reference2" />}
          {form.variant !== FORM_VARIANT.VIEW && (
            <FormControlLabel
              control={(
                <Checkbox
                  checked={uncertain[2]}
                  onChange={() => handleCheckUncertain(2, !uncertain[2])}
                />
              )}
              disabled={form.disabled}
              label="uncertain position"
            />
          )}
          <EmbeddedForm
            {...break2Start.props}
            defaultLinkedClass={coordinateType}
          />
          {Boolean(break2End.value) && (
            <EmbeddedForm
              {...break2End.props}
              defaultLinkedClass={coordinateType}
              required
            />
          )}
        </div>
      )}
    </Box>
  );
}

export default BreakpointsForm;
