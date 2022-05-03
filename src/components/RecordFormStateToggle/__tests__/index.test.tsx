import '@testing-library/jest-dom/extend-expect';

import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import React from 'react';

import { FORM_VARIANT } from '@/components/util';

import RecordFormStateToggle from '..';

describe('RecordFormStateToggle', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('shows graph/edit/view buttons', () => {
    render((
      <RecordFormStateToggle
        allowEdit
        message="Changes you will lose"
        value={FORM_VARIANT.VIEW}
      />
    ));
    expect(screen.getByText('Graph')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
  });

  test('does not show edit button when editing is not allowed', () => {
    render((
      <RecordFormStateToggle
        allowEdit={false}
        message="Changes you will lose"
        value={FORM_VARIANT.VIEW}
      />
    ));
    expect(screen.getByText('Graph')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
  });

  test('onClick handler returns new state', () => {
    const clickSpy = jest.fn();
    render((
      <RecordFormStateToggle
        allowEdit
        message="Changes you will lose"
        onClick={clickSpy}
        value={FORM_VARIANT.VIEW}
      />
    ));
    fireEvent.click(screen.getByText('Edit'));
    expect(clickSpy).toHaveBeenCalledWith('edit');
  });
});
