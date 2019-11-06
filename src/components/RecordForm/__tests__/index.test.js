import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';

import { SnackbarContextProvider as SnackbarProvider } from '@bcgsc/react-snackbar-provider';

import RecordForm from '..';
import { KBContext } from '../../KBContext';
import * as api from '../../../services/api';


jest.mock('@bcgsc/react-snackbar-provider', () => {
  const { createContext } = require('react'); // eslint-disable-line global-require
  const SnackbarContext = createContext({ add: () => {} });

  const SnackbarContextProvider = SnackbarContext.Provider;
  return { SnackbarContext, SnackbarContextProvider };
});


jest.mock('../../../services/api', () => {
  const mockRequest = () => ({
    request: () => Promise.resolve(
      [],
    ),
    abort: () => {},
  });
  return ({
    delete: jest.fn().mockReturnValue(mockRequest()),
    post: jest.fn().mockReturnValue(mockRequest()),
    get: jest.fn().mockReturnValue(mockRequest()),
    patch: jest.fn().mockReturnValue(mockRequest()),
    defaultSuggestionHandler: jest.fn().mockReturnValue(mockRequest()),
  });
});

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
    let getByText;
    let queryByText;

    beforeEach(() => {
      ({ getByText, queryByText } = render(
        <KBContext.Provider value={{ }}>
          <SnackbarProvider value={{ add: snackbarSpy }}>
            <RecordForm
              value={{ name: 'bob', '@rid': '#1:2', '@class': 'User' }}
              modelName="User"
              title="blargh monkeys"
              onTopClick={onTopClickSpy}
              onSubmit={onSubmitSpy}
              onError={onErrorSpy}
              variant="view"
            />
          </SnackbarProvider>
        </KBContext.Provider>,
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
  });

  test('edit statement shows add review for statements', () => {
    const { getByText } = render(
      <KBContext.Provider value={{ }}>
        <SnackbarProvider value={{ add: snackbarSpy }}>
          <RecordForm
            value={{ }}
            modelName="Statement"
            title="blargh monkeys"
            onTopClick={onTopClickSpy}
            onSubmit={onSubmitSpy}
            onError={onErrorSpy}
            variant="edit"
          />
        </SnackbarProvider>
      </KBContext.Provider>,
    );
    expect(getByText('Add Review')).toBeInTheDocument();
  });

  describe('edit variant', () => {
    let getByText;
    let getByTestId;

    beforeEach(() => {
      ({ getByText, getByTestId } = render(
        <KBContext.Provider value={{ }}>
          <SnackbarProvider value={{ add: snackbarSpy }}>
            <RecordForm
              value={{ name: 'bob', '@rid': '#1:2' }}
              modelName="User"
              title="blargh monkeys"
              onTopClick={onTopClickSpy}
              onSubmit={onSubmitSpy}
              onError={onErrorSpy}
              variant="edit"
            />
          </SnackbarProvider>
        </KBContext.Provider>,
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
        <SnackbarProvider value={{ add: snackbarSpy }}>
          <KBContext.Provider value={{ }}>
            <RecordForm
              value={{ }}
              modelName="User"
              title="blargh monkeys"
              onTopClick={onTopClickSpy}
              onSubmit={onSubmitSpy}
              onError={onErrorSpy}
              variant="new"
            />
          </KBContext.Provider>
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
      expect(snackbarSpy).toHaveBeenCalledWith('There are errors in the form which must be resolved before it can be submitted');
    });
  });
});
