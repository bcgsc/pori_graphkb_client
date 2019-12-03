import '@testing-library/jest-dom/extend-expect';

import { render } from '@testing-library/react';
import React from 'react';

import { KBContext } from '@/components/KBContext';

import FormLayout from '..';


describe('FormLayout', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('new variant hides generated fields', () => {
    const { getByText, queryByText } = render(
      <KBContext.Provider value={{ }}>
        <FormLayout
          modelName="User"
          variant="new"
        />
      </KBContext.Provider>,
    );

    expect(getByText('The username')).toBeInTheDocument();
    expect(queryByText('@rid')).not.toBeInTheDocument();
  });

  test('view variant shows generated fields', () => {
    const { getByText, getByTestId } = render(
      <KBContext.Provider value={{ }}>
        <FormLayout
          content={{ '@rid': '#3:4' }}
          modelName="User"
          variant="view"
        />
      </KBContext.Provider>,
    );

    expect(getByText('The username')).toBeInTheDocument();
    expect(getByText('@rid')).toBeInTheDocument();
    expect(getByTestId('@rid')).toBeInTheDocument();
    expect(getByTestId('@rid').value).toEqual('#3:4');
  });
});
