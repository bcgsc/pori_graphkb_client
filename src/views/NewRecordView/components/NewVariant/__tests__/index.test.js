import '@testing-library/jest-dom/extend-expect';

import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import NewVariant from '..';

describe('NewVariant', () => {
  let getByText;
  let getByTestId;
  let queryByText;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    ({
      getByText, getByTestId, queryByText,
    } = render(
      <NewVariant />,
    ));
  });

  test('Substitution hides second breakpoint', () => {
    expect(queryByText('Input the Second Breakpoint')).not.toBeInTheDocument();
    expect(getByText('Pick the Position Coordinate System')).toBeInTheDocument();
  });

  test('Fusion shows reference2', () => {
    fireEvent.click(getByText('Multi-Reference (ex. Translocation)'));
    expect(queryByText('Input the Second Breakpoint')).toBeInTheDocument();
  });

  test('Non-positional hides coordinate input', () => {
    fireEvent.click(getByText('Multi-Reference (ex. Translocation) without Position Information'));
    expect(queryByText('Pick the Position Coordinate System')).not.toBeInTheDocument();
  });

  test('changing coordinate type affects position forms in later section', () => {
    fireEvent.click(getByText('Input the First Breakpoint'));
    expect(getByText('position (GenomicPosition)')).toBeInTheDocument();

    fireEvent.click(getByText('Pick the Position Coordinate System'));
    fireEvent.click(getByTestId('radio-option__CdsPosition'));

    fireEvent.click(getByText('Input the First Breakpoint'));
    expect(getByText('position (CdsPosition)')).toBeInTheDocument();
  });
});
