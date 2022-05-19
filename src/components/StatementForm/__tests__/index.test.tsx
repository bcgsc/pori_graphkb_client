/* eslint-disable react/prop-types */
import '@testing-library/jest-dom/extend-expect';

import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { QueryClientProvider } from 'react-query';

import { AuthContext } from '@/components/Auth';
import { FORM_VARIANT } from '@/components/util';
import api from '@/services/api';

import StatementForm from '..';

const auth = { user: { '@rid': '23:9' }, hasWriteAccess: true };

jest.spyOn(api, 'query').mockImplementation(async (payload) => {
  // to prevent other records causing validation error when running `checkLogicalStatement`
  if (payload.queryType === 'similarTo') {
    return [];
  }

  return [
    {
      '@rid': '11:11',
      displayName: 'anything',
    },
    {
      '@rid': '12:23',
      displayName: 'anything',
    },
    {
      '@rid': '20:20',
      displayName: 'anything',
    },
    {
      '@rid': '90:32',
      displayName: 'anything',
    },
  ];
});

jest.spyOn(api, 'post').mockImplementation(async (_, payload) => payload);

const selectFromAutocomplete = async (label, option, search = 'anything') => {
  const input = screen.getByLabelText(label);
  input.focus();
  fireEvent.change(input, { target: { value: search } });

  // make sure dropdown is visible
  await waitFor(() => {
    expect(screen.getByText(option)).toBeInTheDocument();
  });

  const item = screen.getByText(option);
  fireEvent.click(item);

  input.blur();

  // verify option was selected
  await waitFor(() => {
    expect(screen.getByText(option)).toBeInTheDocument();
  });
};

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
  const snackbarSpy = jest.fn();

  test('edit statement shows add review for statements', () => {
    const { getByText } = render(
      <QueryClientProvider client={api.queryClient}>
        <AuthContext.Provider value={auth}>
          <SnackbarProvider onEnter={snackbarSpy}>
            <StatementForm
              onError={onErrorSpy}
              onSubmit={onSubmitSpy}
              title="blargh monkeys"
              value={{ }}
              variant={FORM_VARIANT.EDIT}
            />
          </SnackbarProvider>
        </AuthContext.Provider>
      </QueryClientProvider>,
    );
    expect(getByText('Add Review')).toBeInTheDocument();
  });

  describe('Statement Add', () => {
    test('sets reviewStatus as initial and adds empty review if left blank', async () => {
      render(
        <QueryClientProvider client={api.queryClient}>
          <SnackbarProvider onEnter={snackbarSpy}>
            <AuthContext.Provider value={auth}>
              <StatementForm
                onError={onErrorSpy}
                onSubmit={onSubmitSpy}
                title="blargh monkeys"
                value={{ }}
                variant={FORM_VARIANT.NEW}
              />
            </AuthContext.Provider>
          </SnackbarProvider>
        </QueryClientProvider>,
      );
      await selectFromAutocomplete(/^conditions/, 'anything (11:11)');
      await selectFromAutocomplete(/^evidence /, 'anything (12:23)');
      await selectFromAutocomplete(/^relevance/, 'anything (90:32)');
      await selectFromAutocomplete(/^subject/, 'anything (20:20)');

      const submitBtn = screen.getByText('SUBMIT');
      expect(submitBtn).toBeEnabled();

      fireEvent.click(submitBtn);

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
      await waitFor(() => {
        expect(onSubmitSpy).toHaveBeenCalledWith(expectedPayload);
      });
    }, 10000);
  });
});
