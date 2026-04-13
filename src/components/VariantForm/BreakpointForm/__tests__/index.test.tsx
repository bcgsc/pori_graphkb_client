import '@testing-library/jest-dom/vitest';

import { schema as schemaDefn } from '@bcgsc-pori/graphkb-schema';
import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { QueryClientProvider } from 'react-query';
import {
  describe, expect, test, vi,
} from 'vitest';

import FormContext, { FormContextState } from '@/components/FormContext';
import { FORM_VARIANT } from '@/components/util';
import api from '@/services/api';

import BreakpointForm from '..';

const CONTEXT_DEFAULTS: FormContextState = {
  formContent: {},
  formVariant: FORM_VARIANT.VIEW,
  update: () => {},
  replaceContent: () => {},
  updateField: () => {},
  updateFieldEvent: () => {},
  setFormIsDirty: () => {},
  formHasErrors: false,
  formIsDirty: false,
  formErrors: {},
  additionalValidationError: '',
};

describe('BreakpointForm', () => {
  test('displays start when given', () => {
    const { getByText, queryByText, getByLabelText } = render(
      <QueryClientProvider client={api.queryClient}>
        <BreakpointForm
          coordinateType="GenomicPosition"
          end="break1End"
          model={schemaDefn.get('PositionalVariant')}
          reference="reference1"
          start="break1Start"
        />
      </QueryClientProvider>,
    );
    expect(getByLabelText(/reference/)).toBeInTheDocument();
    expect(getByText('position (GenomicPosition)')).toBeInTheDocument();
    expect(queryByText('end (GenomicPosition)')).not.toBeInTheDocument();
  });

  test('defaults to uncertain if end is filled in form', () => {
    const { getByText, getByLabelText } = render(
      <QueryClientProvider client={api.queryClient}>
        <FormContext.Provider value={{ ...CONTEXT_DEFAULTS, formContent: { break1End: {} } }}>
          <BreakpointForm
            coordinateType="GenomicPosition"
            end="break1End"
            model={schemaDefn.get('PositionalVariant')}
            reference="reference1"
            start="break1Start"
          />
        </FormContext.Provider>
      </QueryClientProvider>,
    );
    expect(getByLabelText(/reference/)).toBeInTheDocument();
    expect(getByText('start (GenomicPosition)')).toBeInTheDocument();
    expect(getByText('end (GenomicPosition)')).toBeInTheDocument();
  });

  test('clears end from form when uncertain is unset', () => {
    const form = { ...CONTEXT_DEFAULTS, formContent: { break1End: {} }, updateField: vi.fn() };
    const { getByText, getByTestId, getByLabelText } = render(
      <QueryClientProvider client={api.queryClient}>
        <FormContext.Provider value={form}>
          <BreakpointForm
            coordinateType="GenomicPosition"
            end="break1End"
            model={schemaDefn.get('PositionalVariant')}
            reference="reference1"
            start="break1Start"
          />
        </FormContext.Provider>
      </QueryClientProvider>,
    );
    expect(getByLabelText(/reference/)).toBeInTheDocument();
    expect(getByText('start (GenomicPosition)')).toBeInTheDocument();
    expect(getByText('end (GenomicPosition)')).toBeInTheDocument();

    fireEvent.click(getByTestId('breakpoint-form__uncertain-checkbox'));
    expect(form.updateField).toHaveBeenCalledWith('break1End', null);
  });

  test('displays only gene when start not given', () => {
    const { getByLabelText, queryByText } = render(
      <QueryClientProvider client={api.queryClient}>
        <BreakpointForm
          coordinateType="GenomicPosition"
          model={schemaDefn.get('PositionalVariant')}
          reference="reference1"
        />
      </QueryClientProvider>,
    );
    expect(getByLabelText(/reference/)).toBeInTheDocument();
    expect(queryByText('position (GenomicPosition)')).not.toBeInTheDocument();
    expect(queryByText('end (GenomicPosition)')).not.toBeInTheDocument();
  });
});
