import '@testing-library/jest-dom/vitest';

import { render } from '@testing-library/react';
import React from 'react';
import { QueryClientProvider } from 'react-query';
import {
  afterEach,
  describe, expect, test, vi,
} from 'vitest';

import FormContext, { FormContextState } from '@/components/FormContext';
import { FORM_VARIANT } from '@/components/util';
import api from '@/services/api';

import FormLayout from '..';

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

describe('FormLayout', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('new variant hides generated fields', () => {
    const { getByText, queryByText } = render(
      <QueryClientProvider client={api.queryClient}>
        <FormContext.Provider value={{ ...CONTEXT_DEFAULTS, formVariant: FORM_VARIANT.NEW, updateFieldEvent: vi.fn() }}>
          <FormLayout
            modelName="User"
          />
        </FormContext.Provider>
      </QueryClientProvider>,
    );

    expect(getByText('The username')).toBeInTheDocument();
    expect(queryByText('@rid')).not.toBeInTheDocument();
  });

  test('view variant shows generated fields', () => {
    const { getByText, getByLabelText, getByTestId } = render(
      <QueryClientProvider client={api.queryClient}>
        <FormContext.Provider value={{ ...CONTEXT_DEFAULTS, formContent: { '@rid': '#3:4', name: 'name' }, updateFieldEvent: vi.fn() }}>
          <FormLayout
            modelName="User"
          />
        </FormContext.Provider>
      </QueryClientProvider>,
    );

    expect(getByText('The username')).toBeInTheDocument();
    expect(getByLabelText('@rid')).toBeInTheDocument();
    expect(getByTestId('@rid')).toBeInTheDocument();
    expect((getByTestId('@rid') as HTMLInputElement).value).toEqual('#3:4');
  });

  test('exclusion works', () => {
    const { getByText, queryByText } = render(
      <QueryClientProvider client={api.queryClient}>
        <FormContext.Provider value={{ ...CONTEXT_DEFAULTS, formContent: { '@rid': '#3:4', name: 'user' }, updateFieldEvent: vi.fn() }}>
          <FormLayout
            exclusions={['@rid']}
            modelName="User"
          />
        </FormContext.Provider>
      </QueryClientProvider>,
    );

    expect(getByText('The username')).toBeInTheDocument();
    expect(queryByText('@rid')).toBe(null);
  });
});
