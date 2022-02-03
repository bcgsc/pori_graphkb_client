import '@testing-library/jest-dom/extend-expect';

import { fireEvent, render, wait } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import React from 'react';

import { AuthContext } from '@/components/Auth';
import api from '@/services/api';

import StatementForm from '..';


const auth = { user: { '@rid': '23:9' }, hasWriteAccess: true };

jest.spyOn(api, 'post').mockImplementation((_, payload) => payload);

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
      <AuthContext.Provider value={auth}>
        <SnackbarProvider onEnter={snackbarSpy}>
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
      </AuthContext.Provider>,
    );
    expect(getByText('Add Review')).toBeInTheDocument();
  });

  describe('Statement Add', () => {
    let getByText;
    let getByTestId;

    beforeEach(() => {
      ({ getByText, getByTestId } = render(
        <SnackbarProvider onEnter={snackbarSpy}>
          <AuthContext.Provider value={auth}>
            <StatementForm
              modelName="Statement"
              onError={onErrorSpy}
              onSubmit={onSubmitSpy}
              onTopClick={onTopClickSpy}
              title="blargh monkeys"
              value={{ }}
              variant="new"
            />
          </AuthContext.Provider>
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
      await wait(() => {
        expect(onSubmitSpy).toHaveBeenCalledWith(expectedPayload);
      });
    });
  });
});
