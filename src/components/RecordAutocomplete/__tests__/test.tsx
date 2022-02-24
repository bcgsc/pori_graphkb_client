import '@testing-library/jest-dom/extend-expect';

import { fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClientProvider } from 'react-query';

import api from '@/services/api';

import RecordAutocomplete from '..';

const spy = jest
  .spyOn(api, 'post')
  .mockImplementation(() => [{ name: 'bob', '@rid': '#1:0' }, { name: 'alice', '@rid': '#1:1' }]);

describe('RecordAutocomplete (data-fetching)', () => {
  test('singleLoad triggers query', async () => {
    const placeholder = 'input something';
    const { getByText, getByLabelText } = render(
      <QueryClientProvider client={api.queryClient}>
        <RecordAutocomplete
          getQueryBody={() => ({})}
          minSearchLength={0}
          name="test"
          onChange={jest.fn()}
          placeholder={placeholder}
          singleLoad
        />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });

    // click action to render the newly fetched popup options
    fireEvent.click(getByLabelText('Open'));
    await waitFor(() => {
      expect(getByText('bob (#1:0)')).toBeInTheDocument();
      expect(getByText('alice (#1:1)')).toBeInTheDocument();
    });
  });

  test.todo('query triggered on input change');

  afterEach(() => {
    jest.clearAllMocks();
  });
});
