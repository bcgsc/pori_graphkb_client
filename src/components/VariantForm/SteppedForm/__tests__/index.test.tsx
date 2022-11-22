import '@testing-library/jest-dom/extend-expect';

import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import FormStepWrapper from '../../FormStepWrapper';
import SteppedForm from '..';

describe('SteppedForm', () => {
  const submissionSpy = jest.fn();
  let getByText;
  let getByTestId;
  let queryByText;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    ({ getByText, getByTestId, queryByText } = render(
      <SteppedForm
        modelName="stuff"
        onSubmit={submissionSpy}
        properties={{}}
      >
        <FormStepWrapper label="first thing">
          <div>inner first thing</div>
        </FormStepWrapper>
        <FormStepWrapper label="second thing">
          <div>inner second thing</div>
        </FormStepWrapper>
      </SteppedForm>,
    ));
  });

  test('Sets up steps and buttons based on children', () => {
    expect(getByText('first thing')).toBeInTheDocument();
    expect(getByText('second thing')).toBeInTheDocument();
    expect(getByText('SUBMIT')).toBeInTheDocument();
  });

  test('default first step is open/active', () => {
    expect(getByText('inner first thing')).toBeInTheDocument();
    expect(queryByText('inner second thing')).not.toBeInTheDocument();
  });

  test('Changes active step on label click', () => {
    expect(queryByText('inner second thing')).not.toBeInTheDocument();
    fireEvent.click(getByTestId('stepped-form__step-button-1'));
    expect(getByText('inner second thing')).toBeInTheDocument();
  });

  test('submit enabled when all sections visited', () => {
    fireEvent.click(getByTestId('stepped-form__step-button-1'));
    expect(getByText('inner second thing')).toBeInTheDocument();
    fireEvent.click(getByText('SUBMIT'));
    expect(submissionSpy).toHaveBeenCalled();
  });
});
