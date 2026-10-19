import '@testing-library/jest-dom/vitest';

import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { QueryClientProvider } from 'react-query';
import {
  describe, expect, test, vi,
} from 'vitest';

import { FormContext, FormContextState } from '@/components/hooks/useSchemaForm';
import { FORM_VARIANT } from '@/components/util';
import api from '@/services/api';
import schemaDefn from '@/services/schema';

import BreakpointForm from './BreakpointForm';

const CONTEXT_DEFAULTS: FormContextState = {
  content: {},
  variant: FORM_VARIANT.EDIT,
  update: () => {},
  updateField: () => {},
  updateFieldEvent: () => {},
  setDirty: () => {},
  isDirty: false,
  validation: { valid: true, properties: {} },
  model: schemaDefn.get('PositionalVariant'),
  disabled: false,
};

describe('BreakpointForm', () => {
  test('displays start when given', () => {
    const { getByText, queryByText, getByLabelText } = render(
      <QueryClientProvider client={api.queryClient}>
        <FormContext.Provider value={{ ...CONTEXT_DEFAULTS, content: {} }}>
          <BreakpointForm
            breakpoint="1"
            coordinateType="GenomicPosition"
          />
        </FormContext.Provider>
      </QueryClientProvider>,
    );
    expect(getByLabelText(/reference/)).toBeInTheDocument();
    expect(getByText('position (GenomicPosition)')).toBeInTheDocument();
    expect(queryByText('end (GenomicPosition)')).not.toBeInTheDocument();
  });

  test('defaults to uncertain if end is filled in form', () => {
    const { getByText, getByLabelText } = render(
      <QueryClientProvider client={api.queryClient}>
        <FormContext.Provider value={{ ...CONTEXT_DEFAULTS, content: { break1End: {} } }}>
          <BreakpointForm
            breakpoint="1"
            coordinateType="GenomicPosition"
          />
        </FormContext.Provider>
      </QueryClientProvider>,
    );
    expect(getByLabelText(/reference/)).toBeInTheDocument();
    expect(getByText('start (GenomicPosition)')).toBeInTheDocument();
    expect(getByText('end (GenomicPosition)')).toBeInTheDocument();
  });

  test('clears end from form when uncertain is unset', () => {
    const form = { ...CONTEXT_DEFAULTS, content: { break1End: {} }, update: vi.fn() };
    const { getByText, getByTestId, getByLabelText } = render(
      <QueryClientProvider client={api.queryClient}>
        <FormContext.Provider value={form}>
          <BreakpointForm
            breakpoint="1"
            coordinateType="GenomicPosition"
          />
        </FormContext.Provider>
      </QueryClientProvider>,
    );
    expect(getByLabelText(/reference/)).toBeInTheDocument();
    expect(getByText('start (GenomicPosition)')).toBeInTheDocument();
    expect(getByText('end (GenomicPosition)')).toBeInTheDocument();

    fireEvent.click(getByTestId('breakpoint-form__uncertain-checkbox'));
    expect(form.update).toHaveBeenCalledWith({ break1End: null });
  });
});
