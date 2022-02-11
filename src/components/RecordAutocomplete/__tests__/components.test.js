import '@testing-library/jest-dom/extend-expect';

import { render } from '@testing-library/react';
import React from 'react';
import { QueryClientProvider } from 'react-query';

import api from '@/services/api';

import RecordAutocomplete from '..';


describe('RecordAutocomplete', () => {
  test.todo('does not allow text input when disabled');

  test('renders new placeholder', () => {
    const placeholder = 'blargh monkeys';
    const { getByText } = render(
      <QueryClientProvider client={api.queryClient}>
        <RecordAutocomplete
          getQueryBody={jest.fn()}
          name="test"
          onChange={jest.fn()}
          placeholder={placeholder}
        />
      </QueryClientProvider>,
    );
    expect(getByText(placeholder)).toBeInTheDocument();
  });

  test('renders when initial value is given', () => {
    const record = { '@rid': '#2:3', name: 'bob' };
    const { getByText } = render(

      <QueryClientProvider client={api.queryClient}>
        <RecordAutocomplete
          getQueryBody={jest.fn()}
          itemToString={v => v.name}
          name="test"
          onChange={jest.fn()}
          value={record}
        />
      </QueryClientProvider>,
    );
    expect(getByText('bob')).toBeInTheDocument();
  });

  test('renders multiple initial values', () => {
    const record = [{ '@rid': '#2:3', name: 'bob' }, { '@rid': '#2:4', name: 'alice' }];
    const { getByText } = render(
      <QueryClientProvider client={api.queryClient}>
        <RecordAutocomplete
          getQueryBody={jest.fn()}
          isMulti
          itemToString={v => v.name}
          name="test"
          onChange={jest.fn()}
          value={record}
        />
      </QueryClientProvider>,
    );
    expect(getByText('bob')).toBeInTheDocument();
    expect(getByText('alice')).toBeInTheDocument();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
