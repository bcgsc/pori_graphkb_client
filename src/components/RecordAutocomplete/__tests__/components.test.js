import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import { render } from '@testing-library/react';


import RecordAutocomplete from '..';


describe('RecordAutocomplete', () => {
  test.todo('does not allow text input when disabled');
  test('renders new placeholder', () => {
    const placeholder = 'blargh monkeys';
    const { getByText } = render(
      <RecordAutocomplete
        name="test"
        onChange={jest.fn()}
        placeholder={placeholder}
        searchHandler={jest.fn()}
      />,
    );
    expect(getByText(placeholder)).toBeInTheDocument();
  });
  test('renders when initial value is given', () => {
    const record = { '@rid': '#2:3', name: 'bob' };
    const { getByText } = render(
      <RecordAutocomplete
        name="test"
        onChange={jest.fn()}
        itemToString={v => v.name}
        value={record}
        searchHandler={jest.fn()}
      />,
    );
    expect(getByText('bob')).toBeInTheDocument();
  });
  test('renders multiple initial values', () => {
    const record = [{ '@rid': '#2:3', name: 'bob' }, { '@rid': '#2:4', name: 'alice' }];
    const { getByText } = render(
      <RecordAutocomplete
        name="test"
        onChange={jest.fn()}
        itemToString={v => v.name}
        value={record}
        searchHandler={jest.fn()}
        isMulti
      />,
    );
    expect(getByText('bob')).toBeInTheDocument();
    expect(getByText('alice')).toBeInTheDocument();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
