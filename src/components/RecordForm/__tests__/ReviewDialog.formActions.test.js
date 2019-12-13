import '@testing-library/jest-dom/extend-expect';

import { SnackbarContextProvider as SnackbarProvider } from '@bcgsc/react-snackbar-provider';
import { act, fireEvent, render } from '@testing-library/react';
import React from 'react';

import { KBContext } from '@/components/KBContext';

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

/* eslint-disable react/prop-types */
jest.mock('../../DropDownSelect', () => ({
  resources = [], value, onChange, name,
}) => {
  const handleChange = (event) => {
    const option = resources.find(
      opt => opt === event.currentTarget.value,
    );

    onChange({ target: { value: option, name } });
  };
  return (
    <select data-testid="select" onChange={handleChange} value={value}>
      {resources.map(opt => (
        <option key={opt} value={opt}>
          {opt}
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
      <KBContext.Provider value={{ }}>
        <SnackbarProvider value={{ add: snackbarSpy }}>
          <ReviewDialog
            isOpen
            onClose={onCancelSpy}
            onSubmit={onSubmitSpy}
          />
        </SnackbarProvider>
      </KBContext.Provider>,
    ));
  });

  test('does not call submit on missing status', () => {
    fireEvent.click(getByText('ADD REVIEW'));
    expect(getByText('ADD REVIEW')).toBeDisabled();
    expect(snackbarSpy).toHaveBeenCalled();
    expect(snackbarSpy).toHaveBeenCalledWith('There are errors in the form which must be resolved before it can be submitted');
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
