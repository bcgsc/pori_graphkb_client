import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import { render } from '@testing-library/react';

import { SnackbarContextProvider as SnackbarProvider } from '@bcgsc/react-snackbar-provider';

import ReviewDialog from '../ReviewDialog';
import { KBContext } from '../../KBContext';


jest.mock('../../../services/auth', () => ({
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

  const onSubmitSpy = jest.fn();
  const onCancelSpy = jest.fn();
  const snackbarSpy = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    ({ getByText, queryByText } = render(
      <KBContext.Provider value={{ }}>
        <SnackbarProvider value={{ add: snackbarSpy }}>
          <ReviewDialog
            onSubmit={onSubmitSpy}
            isOpen
            onClose={onCancelSpy}
          />
        </SnackbarProvider>
      </KBContext.Provider>,
    ));
  });


  test('shows add review button', () => {
    expect(getByText('ADD REVIEW')).toBeInTheDocument();
  });

  test('displays comment box', () => {
    expect(getByText('comment')).toBeInTheDocument();
  });

  test('does not display createdBy input box', () => {
    expect(queryByText('createdBy')).not.toBeInTheDocument();
  });

  test('shows status drop down', () => {
    expect(getByText('status')).toBeInTheDocument();
  });
});
