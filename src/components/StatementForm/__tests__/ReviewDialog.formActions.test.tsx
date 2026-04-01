import '@testing-library/jest-dom/vitest';

import {
  fireEvent, render, screen,
  waitFor,
} from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import {
  afterEach,
  beforeEach,
  describe, expect, test, vi,
} from 'vitest';

import { AuthContext } from '@/components/Auth';

import ReviewDialog from '../ReviewDialog';

vi.mock('../../DropDownSelect', () => ({
  default: ({
    options = [], value, onChange, name,
  }) => {
    const handleChange = (event) => {
      const option = options.find(
        (opt) => opt === event.currentTarget.value,
      );

      onChange({ target: { value: option, name } });
    };
    return (
      <select data-testid="select" onChange={handleChange} value={value}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {(opt as { label: string }).label || opt}
          </option>
        ))}
      </select>
    );
  },
}));

describe('ReviewDialog formActions', () => {
  const onSubmitSpy = vi.fn();
  const onCancelSpy = vi.fn();
  const snackbarSpy = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  beforeEach(() => {
    const auth = {
      user: { '@rid': '#20:0', name: 'name', groups: [] }, hasWriteAccess: true, login: () => {}, logout: () => {}, isAuthenticated: true, error: undefined, isAuthenticating: false,
    };
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
    fireEvent.click(screen.getByText('ADD REVIEW').closest('button')!);
    await waitFor(() => {
      expect(snackbarSpy).not.toHaveBeenCalled();
      expect(onSubmitSpy).toHaveBeenCalled();
    });
  });

  test.todo('infers the createdBy user based on the current token');
});
