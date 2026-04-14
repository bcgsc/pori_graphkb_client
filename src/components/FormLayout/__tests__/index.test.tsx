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

  test('new variant hides generated fields', { timeout: 10000 }, async () => {
    const { findByText, queryByText } = render(
      <QueryClientProvider client={api.queryClient}>
        <FormContext.Provider value={{ ...CONTEXT_DEFAULTS, formVariant: FORM_VARIANT.NEW, updateFieldEvent: vi.fn() }}>
          <FormLayout
            modelName="User"
          />
        </FormContext.Provider>
      </QueryClientProvider>,
    );

    await expect(findByText('The username')).resolves.toBeInTheDocument();
    expect(queryByText('@rid')).not.toBeInTheDocument();
  });

  test('view variant shows generated fields', async () => {
    const { findByText, findByLabelText, findByTestId } = render(
      <QueryClientProvider client={api.queryClient}>
        <FormContext.Provider value={{ ...CONTEXT_DEFAULTS, formContent: { '@rid': '#3:4', name: 'name' }, updateFieldEvent: vi.fn() }}>
          <FormLayout
            modelName="User"
          />
        </FormContext.Provider>
      </QueryClientProvider>,
    );

    await expect(findByText('The username')).resolves.toBeInTheDocument();
    await expect(findByLabelText('@rid')).resolves.toBeInTheDocument();
    await expect(findByTestId('@rid')).resolves.toBeInTheDocument();
    expect((await findByTestId('@rid') as HTMLInputElement).value).toEqual('#3:4');
  });

  test('exclusion works', async () => {
    const { findByText, queryByText } = render(
      <QueryClientProvider client={api.queryClient}>
        <FormContext.Provider value={{ ...CONTEXT_DEFAULTS, formContent: { '@rid': '#3:4', name: 'user' }, updateFieldEvent: vi.fn() }}>
          <FormLayout
            exclusions={['@rid']}
            modelName="User"
          />
        </FormContext.Provider>
      </QueryClientProvider>,
    );

    await expect(findByText('The username')).resolves.toBeInTheDocument();
    expect(queryByText('@rid')).toBe(null);
  });
});
