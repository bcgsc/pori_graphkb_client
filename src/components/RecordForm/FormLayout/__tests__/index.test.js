import '@testing-library/jest-dom/extend-expect';

import { render } from '@testing-library/react';
import React from 'react';

import FormContext from '@/components/FormContext';

import FormLayout from '..';


describe('FormLayout', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('new variant hides generated fields', () => {
    const { getByText, queryByText } = render(
      <FormContext.Provider value={{ formContent: {}, formVariant: 'new', updateFieldEvent: jest.fn() }}>
        <FormLayout
          modelName="User"
          variant="new"
        />
      </FormContext.Provider>,
    );

    expect(getByText('The username')).toBeInTheDocument();
    expect(queryByText('@rid')).not.toBeInTheDocument();
  });

  test('view variant shows generated fields', () => {
    const { getByText, getByTestId } = render(
      <FormContext.Provider value={{ formContent: { '@rid': '#3:4', name: 'name' }, formVariant: 'view', updateFieldEvent: jest.fn() }}>
        <FormLayout
          modelName="User"
        />
      </FormContext.Provider>,
    );

    expect(getByText('The username')).toBeInTheDocument();
    expect(getByText('@rid')).toBeInTheDocument();
    expect(getByTestId('@rid')).toBeInTheDocument();
    expect(getByTestId('@rid').value).toEqual('#3:4');
  });

  test('exclusion works', () => {
    const { getByText, queryByText } = render(
      <FormContext.Provider value={{ formContent: { '@rid': '#3:4', name: 'user' }, formVariant: 'view', updateFieldEvent: jest.fn() }}>
        <FormLayout
          exclusions={['@rid']}
          modelName="User"
        />
      </FormContext.Provider>,
    );

    expect(getByText('The username')).toBeInTheDocument();
    expect(queryByText('@rid')).toBe(null);
  });
});
