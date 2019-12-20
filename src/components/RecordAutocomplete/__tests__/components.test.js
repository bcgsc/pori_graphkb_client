import '@testing-library/jest-dom/extend-expect';

import { fireEvent, render, waitForElement } from '@testing-library/react';
import React from 'react';

import RecordAutocomplete from '..';

const DOWN_ARROW = { keyCode: 40 };


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
        itemToString={v => v.name}
        name="test"
        onChange={jest.fn()}
        searchHandler={jest.fn()}
        value={record}
      />,
    );
    expect(getByText('bob')).toBeInTheDocument();
  });

  test('renders multiple initial values', () => {
    const record = [{ '@rid': '#2:3', name: 'bob' }, { '@rid': '#2:4', name: 'alice' }];
    const { getByText } = render(
      <RecordAutocomplete
        isMulti
        itemToString={v => v.name}
        name="test"
        onChange={jest.fn()}
        searchHandler={jest.fn()}
        value={record}
      />,
    );
    expect(getByText('bob')).toBeInTheDocument();
    expect(getByText('alice')).toBeInTheDocument();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
