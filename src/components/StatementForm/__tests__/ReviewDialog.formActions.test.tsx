import '@testing-library/jest-dom/extend-expect';

import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import React from 'react';

import { AuthContext } from '@/components/Auth';

import ReviewDialog from '../ReviewDialog';

/* eslint-disable react/prop-types */
jest.mock('../../DropDownSelect', () => ({
  options = [], value, onChange, name,
}) => {
  const handleChange = (event) => {
    const option = options.find(
      opt => opt === event.currentTarget.value,
    );

    onChange({ target: { value: option, name } });
  };
  return (
    <select data-testid="select" onChange={handleChange} value={value}>
      {options.map(opt => (
        <option key={opt} value={opt}>
          {opt.label || opt}
        </option>
      ))}
    </select>
  );
});
/* eslint-enable react/prop-types */

describe('ReviewDialog formActions', () => {
  const onSubmitSpy = jest.fn();
  const onCancelSpy = jest.fn();
  const snackbarSpy = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    const auth = { user: { '@rid': '#20:0' } };
    render(
      <AuthContext.Provider value={auth}>
        <SnackbarProvider onEnter={snackbarSpy}>
          <ReviewDialog
            isOpen
            onClose={onCancelSpy}
            onSubmit={onSubmitSpy}
          />
        </SnackbarProvider>
      </AuthContext.Provider>,
    );
  });

  test('does not call submit on missing status', () => {
    fireEvent.click(screen.getByText('ADD REVIEW'));
    expect(screen.getByText('ADD REVIEW').closest('button')).toBeDisabled();
    expect(snackbarSpy).toHaveBeenCalled();
    expect(onSubmitSpy).not.toHaveBeenCalled();
  });

  test('calls submit when status is given', async () => {
    fireEvent.change(screen.getByTestId('select'), { target: { name: 'status', value: 'passed' } });
    expect(screen.getByText('ADD REVIEW').closest('button')).not.toBeDisabled();
    fireEvent.click(screen.getByText('ADD REVIEW').closest('button'));
    await waitFor(() => {
      expect(snackbarSpy).not.toHaveBeenCalled();
      expect(onSubmitSpy).toHaveBeenCalled();
    });
  });

  test.todo('infers the createdBy user based on the current token');
});
