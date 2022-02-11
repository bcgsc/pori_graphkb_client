import { mount } from 'enzyme';
import React from 'react';
import { QueryClientProvider } from 'react-query';

import DetailChip from '@/components/DetailChip';
import api from '@/services/api';

import StatementReviewsTable from '..';


describe('StatementReviewsTable', () => {
  afterEach(() => {
    jest.clearAllMocks();
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

  const mockReviewProps = {
    content: { reviews },
    updateContent: () => {},
  };

  test('mounts successfully', () => {
    const wrapper = mount((
      <QueryClientProvider client={api.queryClient}>
        <StatementReviewsTable
          label="reviews"
          reviewProps={mockReviewProps}
          values={reviews}
        />
      </QueryClientProvider>
    ));

    expect(wrapper.find(StatementReviewsTable)).toBeDefined();
  });

  test('does not crash with empty reviews array ', () => {
    const wrapper = mount((
      <QueryClientProvider client={api.queryClient}>
        <StatementReviewsTable
          label="reviews"
          reviewProps={mockReviewProps}
          values={[]}
        />
      </QueryClientProvider>
    ));

    expect(wrapper.find(StatementReviewsTable)).toBeDefined();
    expect(wrapper.find(DetailChip)).toHaveLength(0);
  });

  test('displays correct number of chips ', () => {
    const wrapper = mount((
      <QueryClientProvider client={api.queryClient}>
        <StatementReviewsTable
          label="reviews"
          reviewProps={mockReviewProps}
          values={reviews}
        />
      </QueryClientProvider>
    ));

    expect(wrapper.find(StatementReviewsTable)).toBeDefined();
    expect(wrapper.find(DetailChip)).toHaveLength(reviews.length);
  });
});
