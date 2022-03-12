import '@testing-library/jest-dom/extend-expect';

import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { QueryClientProvider } from 'react-query';

import { AuthContext } from '@/components/Auth';
import api from '@/services/api';

import RecordForm from '..';

const auth = { user: { '@rid': '23:9' }, hasWriteAccess: true };

jest.spyOn(api, 'post').mockImplementation((route, payload) => payload);
jest.spyOn(api, 'patch').mockImplementation(() => []);
jest.spyOn(api, 'delete').mockImplementation(() => []);
jest.spyOn(api, 'get').mockImplementation(() => []);

jest.mock('@/components/RecordAutocomplete', () => (({
  value, onChange, name, label,
}) => {
  const mockValues = {
    conditions: ['11:11'],
    evidence: ['12:23'],
    subject: '20:20',
    relevance: '90:32',
  };

  const handleChange = (event) => {
    onChange({ target: { name, value: mockValues[event.currentTarget.value] } });
  };

  return (
    <select data-testid={`${name}-select`} id={`${name}-id`} onChange={handleChange} value={value}>
      <option key="test" value={value}>
        {label}
      </option>
    </select>
  );
}));

const originalError = console.error;

console.error = (msg) => {
  if (!msg.toString().includes('inside a test was not wrapped in act')) {
    originalError(msg);
  }
};

describe('RecordForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const onSubmitSpy = jest.fn();
  const onErrorSpy = jest.fn();
  const onTopClickSpy = jest.fn();
  const snackbarSpy = jest.fn();

  describe('view variant', () => {
    const navSpy = jest.fn();

    beforeEach(() => {
      render(
        <QueryClientProvider client={api.queryClient}>
          <AuthContext.Provider value={auth}>
            <SnackbarProvider onEnter={snackbarSpy}>
              <RecordForm
                modelName="User"
                navigateToGraph={navSpy}
                onError={onErrorSpy}
                onSubmit={onSubmitSpy}
                onTopClick={onTopClickSpy}
                title="blargh monkeys"
                value={{ name: 'bob', '@rid': '#1:2', '@class': 'User' }}
                variant="view"
              />
            </SnackbarProvider>
          </AuthContext.Provider>
        </QueryClientProvider>,
      );
    });

    test('shows edit button', () => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    test('renders the title', () => {
      expect(screen.getByText('blargh monkeys')).toBeInTheDocument();
    });

    test('click edit triggers onTopClick handler', () => {
      const editButton = screen.getByText('Edit').closest('button');
      fireEvent.click(editButton);
      expect(onTopClickSpy).toHaveBeenCalledTimes(1);
    });

    test('no submit button', () => {
      expect(screen.queryByText('SUBMIT')).not.toBeInTheDocument();
      expect(screen.queryByText('SUBMIT CHANGES')).not.toBeInTheDocument();
    });

    test('triggers graphview navigation on graphview icon click', () => {
      const graphviewBtn = screen.getByTestId('graph-view');
      fireEvent.click(graphviewBtn);
      expect(navSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('edit variant', () => {
    beforeEach(() => {
      render(
        <QueryClientProvider client={api.queryClient}>
          <AuthContext.Provider value={auth}>
            <SnackbarProvider onEnter={snackbarSpy}>
              <RecordForm
                modelName="User"
                onError={onErrorSpy}
                onSubmit={onSubmitSpy}
                onTopClick={onTopClickSpy}
                title="blargh monkeys"
                value={{ name: 'bob', '@rid': '#1:2' }}
                variant="edit"
              />
            </SnackbarProvider>
          </AuthContext.Provider>
        </QueryClientProvider>,
      );
    });

    test('shows view button', () => {
      expect(screen.getByText('View')).toBeInTheDocument();
    });

    test('shows delete button', () => {
      expect(screen.getByText('DELETE')).toBeInTheDocument();
    });

    test('shows submit button', () => {
      expect(screen.getByText('SUBMIT CHANGES')).toBeInTheDocument();
    });

    test('submit calls patch endpoint', async () => {
      fireEvent.click(screen.getByText('SUBMIT CHANGES'));
      await waitFor(() => {
        expect(onSubmitSpy).toHaveBeenCalledTimes(1);
      });
    });

    test('disables submit when form is dirty with errors', () => {
      // make bad change
      fireEvent.change(screen.getByTestId('name'), { target: { name: 'name', value: '' } });
      expect(screen.getByText('SUBMIT CHANGES').closest('button')).toBeDisabled();
      expect(onSubmitSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('new variant', () => {
    beforeEach(() => {
      render(
        <QueryClientProvider client={api.queryClient}>
          <SnackbarProvider onEnter={snackbarSpy}>
            <AuthContext.Provider value={auth}>
              <RecordForm
                modelName="User"
                onError={onErrorSpy}
                onSubmit={onSubmitSpy}
                onTopClick={onTopClickSpy}
                title="blargh monkeys"
                value={{ }}
                variant="new"
              />
            </AuthContext.Provider>
          </SnackbarProvider>
        </QueryClientProvider>,
      );
    });

    test('submits when no errors', async () => {
      fireEvent.change(screen.getByTestId('name'), { target: { name: 'name', value: 'bob' } });
      await waitFor(() => {
        expect(screen.getByText('SUBMIT').closest('button')).not.toBeDisabled();
      });
      fireEvent.click(screen.getByText('SUBMIT').closest('button'));
      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
        expect(onSubmitSpy).toHaveBeenCalled();
      });
    });

    test('disables submit when form is dirty with errors', async () => {
      // make bad change
      fireEvent.change(screen.getByTestId('name'), { target: { name: 'name', value: 'bob' } });
      fireEvent.change(screen.getByTestId('name'), { target: { name: 'name', value: '' } });
      await waitFor(() => {
        expect(screen.getByText('SUBMIT').closest('button')).toBeDisabled();
      });
      fireEvent.click(screen.getByText('SUBMIT').closest('button'));
      await waitFor(() => {
        expect(onSubmitSpy).not.toHaveBeenCalled();
      });
    });

    test('shows submit button', () => {
      expect(screen.getByText('SUBMIT').closest('button')).toBeInTheDocument();
    });

    test('form is not disabled when pristine with errors', async () => {
      // make bad change
      expect(screen.getByText('SUBMIT').closest('button')).not.toBeDisabled();
      fireEvent.click(screen.getByText('SUBMIT').closest('button'));

      await waitFor(() => {
        expect(onSubmitSpy).not.toHaveBeenCalled();
        expect(screen.getByText('SUBMIT').closest('button')).toBeDisabled();
        expect(snackbarSpy).toHaveBeenCalled();
      });
    });
  });
});
