import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import React from 'react';
import { QueryClientProvider } from 'react-query';
import {
  afterEach, describe, expect,
  test, vi,
} from 'vitest';

import api from '@/services/api';

import StatementReviewsTable from '..';

vi.spyOn(api, 'query').mockImplementation(async () => [{ '@rid': '#19:0', name: 'bob' }]);

describe('StatementReviewsTable', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const reviews = [
    {
      '@class': 'StatementReview',
      createdBy: '#19:0',
      status: 'initial',
      createdAt: 1565376648434,
      comment: 'first',
    },
    {
      '@class': 'StatementReview',
      createdBy: '#19:0',
      status: 'initial',
      createdAt: 1565376648434,
      comment: 'second',
    }, {
      '@class': 'StatementReview',
      createdBy: '#19:0',
      status: 'initial',
      createdAt: 1565376648434,
      comment: 'third',
    },
  ];

  test('does not crash with empty reviews array', () => {
    render(
      <QueryClientProvider client={api.queryClient}>
        <StatementReviewsTable
          name="reviews"
          onChange={vi.fn()}
          values={[]}
        />
      </QueryClientProvider>,
    );

    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  test('displays correct number of chips', () => {
    render(
      <QueryClientProvider client={api.queryClient}>
        <StatementReviewsTable
          name="reviews"
          onChange={vi.fn()}
          values={reviews}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Reviews')).toBeTruthy();
    expect(screen.getAllByRole('row')).toHaveLength(1 + reviews.length);
  });

  test.each([{ '@rid': '#19:0', name: 'bob' }, '#19:0'])('displays who created review', async (user) => {
    render(
      <QueryClientProvider client={api.queryClient}>
        <StatementReviewsTable
          name="reviews"
          onChange={vi.fn()}
          values={[{
            '@class': 'StatementReview',
            createdBy: user,
            status: 'initial',
            createdAt: 1565376648434,
            comment: 'second',
          }]}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Reviews')).toBeTruthy();
    expect(screen.getAllByRole('row')).toHaveLength(2);
    await expect(screen.findByText('bob (#19:0)')).resolves.toBeInTheDocument();
  });
});
