import '@testing-library/jest-dom/vitest';

import {
  render,
} from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router';
import {
  afterEach,
  beforeEach,
  describe, expect, test, vi,
} from 'vitest';

import GettingStarted from '..';

describe('GettingStarted', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  let getAllByText;

  beforeEach(() => {
    ({
      getAllByText,
    } = render(
      <BrowserRouter><GettingStarted /></BrowserRouter>,
    ));
  });

  test('has welcome section', () => {
    expect(getAllByText('Welcome to GraphKB')).toHaveProperty('length', 1);
  });

  test('has core concepts section', () => {
    expect(getAllByText('Core Concepts')).toHaveProperty('length', 2);
  });

  test('has statement examples section', () => {
    expect(getAllByText('Statement Examples')).toHaveProperty('length', 2);
  });
});
