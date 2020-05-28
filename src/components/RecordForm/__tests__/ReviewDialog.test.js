import '@testing-library/jest-dom/extend-expect';

import { SnackbarContextProvider as SnackbarProvider } from '@bcgsc/react-snackbar-provider';
import { render } from '@testing-library/react';
import React from 'react';

import { SecurityContext } from '@/components/SecurityContext';

import ReviewDialog from '../ReviewDialog';


jest.mock('@/services/auth', () => ({
  getUser: () => ({ '@rid': '#20:0' }),
}));


jest.mock('@bcgsc/react-snackbar-provider', () => {
  const { createContext } = require('react'); // eslint-disable-line global-require
  const SnackbarContext = createContext({ add: () => {} });

  const SnackbarContextProvider = SnackbarContext.Provider;
  return { SnackbarContext, SnackbarContextProvider };
});


describe('ReviewDialog', () => {
  let getByText;
  let queryByText;
  let getAllByText;

  const onSubmitSpy = jest.fn();
  const onCancelSpy = jest.fn();
  const snackbarSpy = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    ({ getByText, queryByText, getAllByText } = render(
      <SecurityContext.Provider value={{ }}>
        <SnackbarProvider value={{ add: snackbarSpy }}>
          <ReviewDialog
            isOpen
            onClose={onCancelSpy}
            onSubmit={onSubmitSpy}
          />
        </SnackbarProvider>
      </SecurityContext.Provider>,
    ));
  });


  test('shows add review button', () => {
    expect(getByText('ADD REVIEW')).toBeInTheDocument();
  });

  test('displays comment box', () => {
    const commentNodes = getAllByText('comment');
    expect(commentNodes).toHaveLength(2);
    expect(commentNodes[0]).toBeInTheDocument();
    expect(commentNodes[1]).toBeInTheDocument();
  });

  test('does not display createdBy input box', () => {
    expect(queryByText('createdBy')).not.toBeInTheDocument();
  });

  test('shows status drop down', () => {
    expect(getByText('status')).toBeInTheDocument();
  });
});
