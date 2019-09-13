import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import { render, fireEvent, waitForElement } from '@testing-library/react';


import RecordAutocomplete from '..';


const mockSearchHandler = (values = []) => {
  const request = jest.fn();
  request.mockResolvedValue(
    values.map(
      (value, index) => Object.assign({}, { '@rid': `#1:${index}` }, value),
    ),
  );
  return jest.fn().mockReturnValue({ abort: jest.fn(), request });
};

/* eslint-disable react/prop-types */
jest.mock('react-select', () => ({ options = [], value, onChange }) => {
  const handleChange = (event) => {
    const option = options.find(
      opt => opt.value === event.currentTarget.value,
    );
    onChange(option);
  };
  return (
    <select data-testid="select" value={value} onChange={handleChange}>
      {options.map(({ name }) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
});
/* eslint-enable react/prop-types */


describe('RecordAutocomplete (data-fetching)', () => {
  test('singleLoad triggers searchHandler', async () => {
    const spy = mockSearchHandler([{ name: 'bob' }, { name: 'alice' }]);
    const placeholder = 'input something';
    const { getByText, getByTestId } = render(
      <RecordAutocomplete
        name="test"
        onChange={jest.fn()}
        searchHandler={spy}
        singleLoad
        placeholder={placeholder}
        minSearchLength={0}
      />,
    );
    expect(spy).toHaveBeenCalledTimes(1);
    // click action to render the newly fetched popup options
    fireEvent.click(getByTestId('select'));
    const [bob, alice] = await waitForElement(() => [getByText('bob'), getByText('alice')]);
    expect(bob).toBeInTheDocument();
    expect(alice).toBeInTheDocument();
  });

  test.todo('searchHandler triggered on input change');

  afterEach(() => {
    jest.clearAllMocks();
  });
});
