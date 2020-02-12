import '@testing-library/jest-dom/extend-expect';

import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import FormContext from '@/components/FormContext';

import BreakpointForm from '..';


describe('BreakpointForm', () => {
  test('displays start when given', () => {
    const { getByText, queryByText } = render(
      <BreakpointForm
        coordinateType="GenomicPosition"
        end="break1End"
        reference="reference1"
        start="break1Start"
      />,
    );
    expect(getByText(/\breference\b/)).toBeInTheDocument();
    expect(getByText('position (GenomicPosition)')).toBeInTheDocument();
    expect(queryByText('end (GenomicPosition)')).not.toBeInTheDocument();
  });

  test('defaults to uncertain if end is filled in form', () => {
    const { getByText } = render(
      <FormContext.Provider value={{ formContent: { break1End: {} } }}>
        <BreakpointForm
          coordinateType="GenomicPosition"
          end="break1End"
          reference="reference1"
          start="break1Start"
        />
      </FormContext.Provider>,
    );
    expect(getByText(/\breference\b/)).toBeInTheDocument();
    expect(getByText('start (GenomicPosition)')).toBeInTheDocument();
    expect(getByText('end (GenomicPosition)')).toBeInTheDocument();
  });

  test('clears end from form when uncertain is unset', () => {
    const form = { formContent: { break1End: {} }, updateField: jest.fn() };
    const { getByText, getByTestId } = render(
      <FormContext.Provider value={form}>
        <BreakpointForm
          coordinateType="GenomicPosition"
          end="break1End"
          reference="reference1"
          start="break1Start"
        />
      </FormContext.Provider>,
    );
    expect(getByText(/\breference\b/)).toBeInTheDocument();
    expect(getByText('start (GenomicPosition)')).toBeInTheDocument();
    expect(getByText('end (GenomicPosition)')).toBeInTheDocument();

    fireEvent.click(getByTestId('breakpoint-form__uncertain-checkbox'));
    expect(form.updateField).toHaveBeenCalledWith('break1End', null);
  });

  test('displays only gene when start not given', () => {
    const { getByText, queryByText } = render(
      <BreakpointForm coordinateType="GenomicPosition" reference="reference1" />,
    );
    expect(getByText(/\breference\b/)).toBeInTheDocument();
    expect(queryByText('position (GenomicPosition)')).not.toBeInTheDocument();
    expect(queryByText('end (GenomicPosition)')).not.toBeInTheDocument();
  });
});
