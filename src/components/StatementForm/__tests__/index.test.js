import '@testing-library/jest-dom/extend-expect';

import { SnackbarContextProvider as SnackbarProvider } from '@bcgsc/react-snackbar-provider';
import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import { SecurityContext } from '@/components/SecurityContext';

import StatementForm from '..';

jest.mock('@/services/auth', () => ({
  getUser: () => '23:9',
}));

jest.mock('@bcgsc/react-snackbar-provider', () => {
  const { createContext } = require('react'); // eslint-disable-line global-require
  const SnackbarContext = createContext({ add: () => {} });

  const SnackbarContextProvider = SnackbarContext.Provider;
  return { SnackbarContext, SnackbarContextProvider };
});

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


describe('StatementForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const onSubmitSpy = jest.fn();
  const onErrorSpy = jest.fn();
  const onTopClickSpy = jest.fn();
  const snackbarSpy = jest.fn();

  test('edit statement shows add review for statements', () => {
    const { getByText } = render(
      <SecurityContext.Provider value={{ }}>
        <SnackbarProvider value={{ add: snackbarSpy }}>
          <StatementForm
            modelName="Statement"
            onError={onErrorSpy}
            onSubmit={onSubmitSpy}
            onTopClick={onTopClickSpy}
            title="blargh monkeys"
            value={{ }}
            variant="edit"
          />
        </SnackbarProvider>
      </SecurityContext.Provider>,
    );
    expect(getByText('Add Review')).toBeInTheDocument();
  });

  describe('Statement Add', () => {
    let getByText;
    let getByTestId;

    beforeEach(() => {
      ({ getByText, getByTestId } = render(
        <SnackbarProvider value={{ add: snackbarSpy }}>
          <SecurityContext.Provider value={{ }}>
            <StatementForm
              modelName="Statement"
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


    test('sets reviewStatus as initial and adds empty review if left blank', async () => {
      await fireEvent.change(getByTestId('conditions-select'), { target: { value: ['11:11'] } });
      await fireEvent.change(getByTestId('evidence-select'), { target: { value: ['12:23'] } });
      await fireEvent.change(getByTestId('relevance-select'), { target: { value: '90:32' } });
      await fireEvent.change(getByTestId('subject-select'), { target: { value: 'man' } });

      const submitBtn = getByText('SUBMIT');
      await fireEvent.click(submitBtn);
      const expectedPayload = {
        '@class': 'Statement',
        conditions: ['11:11'],
        evidence: ['12:23'],
        relevance: '90:32',
        subject: '20:20',
        reviewStatus: 'initial',
        reviews: [{
          status: 'initial',
          comment: '',
          createdBy: '23:9',
        }],
      };
      expect(onSubmitSpy).toHaveBeenCalledWith(expectedPayload);
    });
  });
});
