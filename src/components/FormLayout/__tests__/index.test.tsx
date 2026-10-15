import '@testing-library/jest-dom/vitest';

import { render } from '@testing-library/react';
import React from 'react';
import { QueryClientProvider } from 'react-query';
import {
  afterEach,
  describe, expect, test, vi,
} from 'vitest';

import { FormContext, FormContextState } from '@/components/hooks/useSchemaForm';
import { FORM_VARIANT } from '@/components/util';
import api from '@/services/api';
import schema from '@/services/schema';

import FormLayout from '..';

const CONTEXT_DEFAULTS: FormContextState = {
  content: {},
  variant: FORM_VARIANT.VIEW,
  update: () => {},
  updateField: () => {},
  updateFieldEvent: () => {},
  setDirty: () => {},
  isDirty: false,
  validation: { valid: true, properties: {} },
  model: schema.get('User'),
};

describe('FormLayout', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('new variant hides generated fields', { timeout: 10000 }, async () => {
    const { findByText, queryByText } = render(
      <QueryClientProvider client={api.queryClient}>
        <FormContext.Provider value={{ ...CONTEXT_DEFAULTS, variant: FORM_VARIANT.NEW, updateFieldEvent: vi.fn() }}>
          <FormLayout />
        </FormContext.Provider>
      </QueryClientProvider>,
    );

    await expect(findByText('The username')).resolves.toBeInTheDocument();
    expect(queryByText('@rid')).not.toBeInTheDocument();
  });

  test('view variant shows generated fields', async () => {
    const { findByText, findByLabelText, findByTestId } = render(
      <QueryClientProvider client={api.queryClient}>
        <FormContext.Provider value={{ ...CONTEXT_DEFAULTS, content: { '@rid': '#3:4', name: 'name' }, updateFieldEvent: vi.fn() }}>
          <FormLayout />
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
        <FormContext.Provider value={{ ...CONTEXT_DEFAULTS, content: { '@rid': '#3:4', name: 'user' }, updateFieldEvent: vi.fn() }}>
          <FormLayout
            exclusions={['@rid']}
          />
        </FormContext.Provider>
      </QueryClientProvider>,
    );

    await expect(findByText('The username')).resolves.toBeInTheDocument();
    expect(queryByText('@rid')).toBe(null);
  });
});
