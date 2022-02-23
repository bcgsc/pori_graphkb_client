import '@testing-library/jest-dom/extend-expect';

import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { QueryClientProvider } from 'react-query';

import FormContext from '@/components/FormContext';
import api from '@/services/api';
import schema from '@/services/schema';

import BreakpointForm from '..';

describe('BreakpointForm', () => {
  test('displays start when given', () => {
    const { getByText, queryByText } = render(
      <QueryClientProvider client={api.queryClient}>
        <BreakpointForm
          coordinateType="GenomicPosition"
          end="break1End"
          model={schema.schema.PositionalVariant}
          reference="reference1"
          start="break1Start"
        />
      </QueryClientProvider>,
    );
    expect(getByText(/\breference\b/)).toBeInTheDocument();
    expect(getByText('position (GenomicPosition)')).toBeInTheDocument();
    expect(queryByText('end (GenomicPosition)')).not.toBeInTheDocument();
  });

  test('defaults to uncertain if end is filled in form', () => {
    const { getByText } = render(
      <QueryClientProvider client={api.queryClient}>
        <FormContext.Provider value={{ formContent: { break1End: {} } }}>
          <BreakpointForm
            coordinateType="GenomicPosition"
            end="break1End"
            model={schema.schema.PositionalVariant}
            reference="reference1"
            start="break1Start"
          />
        </FormContext.Provider>
      </QueryClientProvider>,
    );
    expect(getByText(/\breference\b/)).toBeInTheDocument();
    expect(getByText('start (GenomicPosition)')).toBeInTheDocument();
    expect(getByText('end (GenomicPosition)')).toBeInTheDocument();
  });

  test('clears end from form when uncertain is unset', () => {
    const form = { formContent: { break1End: {} }, updateField: jest.fn() };
    const { getByText, getByTestId } = render(
      <QueryClientProvider client={api.queryClient}>
        <FormContext.Provider value={form}>
          <BreakpointForm
            coordinateType="GenomicPosition"
            end="break1End"
            model={schema.schema.PositionalVariant}
            reference="reference1"
            start="break1Start"
          />
        </FormContext.Provider>
      </QueryClientProvider>,
    );
    expect(getByText(/\breference\b/)).toBeInTheDocument();
    expect(getByText('start (GenomicPosition)')).toBeInTheDocument();
    expect(getByText('end (GenomicPosition)')).toBeInTheDocument();

    fireEvent.click(getByTestId('breakpoint-form__uncertain-checkbox'));
    expect(form.updateField).toHaveBeenCalledWith('break1End', null);
  });

  test('displays only gene when start not given', () => {
    const { getByText, queryByText } = render(
      <QueryClientProvider client={api.queryClient}>
        <BreakpointForm
          coordinateType="GenomicPosition"
          model={schema.schema.PositionalVariant}
          reference="reference1"
        />
      </QueryClientProvider>,
    );
    expect(getByText(/\breference\b/)).toBeInTheDocument();
    expect(queryByText('position (GenomicPosition)')).not.toBeInTheDocument();
    expect(queryByText('end (GenomicPosition)')).not.toBeInTheDocument();
  });
});
