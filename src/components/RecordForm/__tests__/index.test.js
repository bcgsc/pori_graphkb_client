import '@testing-library/jest-dom/extend-expect';

import { act, fireEvent, render } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import React from 'react';

import { SecurityContext } from '@/components/SecurityContext';
import * as api from '@/services/api';

import RecordForm from '..';

jest.mock('@/services/auth', () => ({
  getUser: () => '23:9',
}));

jest.mock('@/services/api', () => {
  const mockRequest = () => ({
    request: () => Promise.resolve(
      [],
    ),
    abort: () => {},
  });

  // to check that initial reviewStatus is set to initial by default
  const mockPost = jest.fn((route, payload) => ({ request: () => payload, abort: () => {} }));
  return ({
    delete: jest.fn().mockReturnValue(mockRequest()),
    post: mockPost,
    get: jest.fn().mockReturnValue(mockRequest()),
    patch: jest.fn().mockReturnValue(mockRequest()),
    defaultSuggestionHandler: jest.fn().mockReturnValue(mockRequest()),
  });
});


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
    let getByText;
    let queryByText;
    let getByTestId;

    beforeEach(() => {
      ({ getByText, queryByText, getByTestId } = render(
        <SecurityContext.Provider value={{ }}>
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
        </SecurityContext.Provider>,
      ));
    });


    test('shows edit button', () => {
      expect(getByText('Edit')).toBeInTheDocument();
    });

    test('renders the title', () => {
      expect(getByText('blargh monkeys')).toBeInTheDocument();
    });

    test('click edit triggers onTopClick handler', () => {
      const editButton = getByText('Edit');
      fireEvent.click(editButton);
      expect(onTopClickSpy).toHaveBeenCalledTimes(1);
    });

    test('no submit button', () => {
      expect(queryByText('SUBMIT')).not.toBeInTheDocument();
      expect(queryByText('SUBMIT CHANGES')).not.toBeInTheDocument();
    });

    test('triggers graphview navigation on graphview icon click', () => {
      const graphviewBtn = getByTestId('graph-view');
      fireEvent.click(graphviewBtn);
      expect(navSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('edit variant', () => {
    let getByText;
    let getByTestId;

    beforeEach(() => {
      ({ getByText, getByTestId } = render(
        <SecurityContext.Provider value={{ }}>
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
        </SecurityContext.Provider>,
      ));
    });


    test('shows view button', () => {
      expect(getByText('View')).toBeInTheDocument();
    });

    test('shows delete button', () => {
      expect(getByText('DELETE')).toBeInTheDocument();
    });

    test('shows submit button', () => {
      expect(getByText('SUBMIT CHANGES')).toBeInTheDocument();
    });

    test('submit calls patch endpoint', () => {
      fireEvent.click(getByText('SUBMIT CHANGES'));
      expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    });

    test('disables submit when form is dirty with errors', () => {
      // make bad change
      fireEvent.change(getByTestId('name'), { target: { name: 'name', value: '' } });
      expect(getByText('SUBMIT CHANGES')).toBeDisabled();
      fireEvent.click(getByText('SUBMIT CHANGES'));
      expect(onSubmitSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('new variant', () => {
    let getByText;
    let getByTestId;

    beforeEach(() => {
      ({ getByText, getByTestId } = render(
        <SnackbarProvider onEnter={snackbarSpy}>
          <SecurityContext.Provider value={{ }}>
            <RecordForm
              modelName="User"
              onError={onErrorSpy}
              onSubmit={onSubmitSpy}
              onTopClick={onTopClickSpy}
              title="blargh monkeys"
              value={{ }}
              variant="new"
            />
          </SecurityContext.Provider>
        </SnackbarProvider>,
      ));
    });

    test('submits when no errors', async () => {
      fireEvent.change(getByTestId('name'), { target: { name: 'name', value: 'bob' } });
      expect(getByText('SUBMIT')).not.toBeDisabled();
      await act(async () => fireEvent.click(getByText('SUBMIT')));
      expect(api.post).toHaveBeenCalled();
      expect(onSubmitSpy).toHaveBeenCalled();
    });

    test('disables submit when form is dirty with errors', () => {
      // make bad change
      fireEvent.change(getByTestId('name'), { target: { name: 'name', value: 'bob' } });
      fireEvent.change(getByTestId('name'), { target: { name: 'name', value: '' } });
      expect(getByText('SUBMIT')).toBeDisabled();
      fireEvent.click(getByText('SUBMIT'));
      expect(onSubmitSpy).not.toHaveBeenCalled();
    });

    test('shows submit button', () => {
      expect(getByText('SUBMIT')).toBeInTheDocument();
    });

    test('form is not disabled when pristine with errors', () => {
      // make bad change
      expect(getByText('SUBMIT')).not.toBeDisabled();
      fireEvent.click(getByText('SUBMIT'));
      expect(onSubmitSpy).not.toHaveBeenCalled();
      expect(getByText('SUBMIT')).toBeDisabled();
      expect(snackbarSpy).toHaveBeenCalled();
    });
  });
});
