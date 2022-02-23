import '@testing-library/jest-dom/extend-expect';

import { render } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import React from 'react';

import { AuthContext } from '@/components/Auth';

import ReviewDialog from '../ReviewDialog';

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

  const auth = { user: { '@rid': '#20:0' } };

  beforeEach(() => {
    ({ getByText, queryByText, getAllByText } = render(
      <AuthContext.Provider value={auth}>
        <SnackbarProvider onEnter={snackbarSpy}>
          <ReviewDialog
            isOpen
            onClose={onCancelSpy}
            onSubmit={onSubmitSpy}
          />
        </SnackbarProvider>
      </AuthContext.Provider>,
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
