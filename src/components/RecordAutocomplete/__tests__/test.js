import '@testing-library/jest-dom/extend-expect';

import {
  fireEvent, render, wait, waitForElement,
} from '@testing-library/react';
import React from 'react';

import api from '@/services/api';

import RecordAutocomplete from '..';

const spy = jest
  .spyOn(api, 'post')
  .mockImplementation(() => [{ name: 'bob', '@rid': '#1:0' }, { name: 'alice', '@rid': '#1:1' }]);

/* eslint-disable react/prop-types */
jest.mock('react-select', () => ({ options = [], value, onChange }) => {
  const handleChange = (event) => {
    const option = options.find(
      opt => opt.value === event.currentTarget.value,
    );
    onChange(option);
  };
  return (
    <select data-testid="select" onChange={handleChange} value={value}>
      {options.map(({ name, options: subOptions }) => {
        if (subOptions) {
          return (
            <div key={name}>
              {subOptions.map(subOption => (<option key={subOption.name} value={subOption.name}>{subOption.name}</option>))}
            </div>
          );
        }
        return (
          <option key={name} value={name}>
            {name}
          </option>
        );
      })}
    </select>
  );
});
/* eslint-enable react/prop-types */


describe('RecordAutocomplete (data-fetching)', () => {
  test('singleLoad triggers query', async () => {
    const placeholder = 'input something';
    const { getByText, getByTestId } = render(
      <RecordAutocomplete
        getQueryBody={() => ({})}
        minSearchLength={0}
        name="test"
        onChange={jest.fn()}
        placeholder={placeholder}
        singleLoad
      />,
    );

    await wait(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
    // click action to render the newly fetched popup options
    fireEvent.click(getByTestId('select'));
    const [bob, alice] = await waitForElement(() => [getByText('bob'), getByText('alice')]);
    expect(bob).toBeInTheDocument();
    expect(alice).toBeInTheDocument();
  });

  test.todo('query triggered on input change');

  afterEach(() => {
    jest.clearAllMocks();
  });
});
