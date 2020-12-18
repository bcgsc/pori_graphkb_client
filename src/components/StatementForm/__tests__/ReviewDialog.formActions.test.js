import '@testing-library/jest-dom/extend-expect';

import { act, fireEvent, render } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import React from 'react';

import { SecurityContext } from '@/components/SecurityContext';

import ReviewDialog from '../ReviewDialog';


jest.mock('@/services/auth', () => ({
  getUser: () => ({ '@rid': '#20:0' }),
}));

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
  let getByText;
  let getByTestId;

  const onSubmitSpy = jest.fn();
  const onCancelSpy = jest.fn();
  const snackbarSpy = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    ({ getByText, getByTestId } = render(
      <SecurityContext.Provider value={{ }}>
        <SnackbarProvider onEnter={snackbarSpy}>
          <ReviewDialog
            isOpen
            onClose={onCancelSpy}
            onSubmit={onSubmitSpy}
          />
        </SnackbarProvider>
      </SecurityContext.Provider>,
    ));
  });

  test('does not call submit on missing status', () => {
    fireEvent.click(getByText('ADD REVIEW'));
    expect(getByText('ADD REVIEW')).toBeDisabled();
    expect(snackbarSpy).toHaveBeenCalled();
    expect(onSubmitSpy).not.toHaveBeenCalled();
  });

  test('calls submit when status is given', async () => {
    await act(async () => fireEvent.change(getByTestId('select'), { target: { name: 'status', value: 'passed' } }));
    expect(getByText('ADD REVIEW')).not.toBeDisabled();
    fireEvent.click(getByText('ADD REVIEW'));
    expect(snackbarSpy).not.toHaveBeenCalled();
    expect(onSubmitSpy).toHaveBeenCalled();
  });

  test.todo('infers the createdBy user based on the current token');
});
