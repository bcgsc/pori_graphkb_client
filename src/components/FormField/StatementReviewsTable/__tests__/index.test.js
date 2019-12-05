import { mount } from 'enzyme';
import React from 'react';

import DetailChip from '@/components/DetailChip';

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
      <StatementReviewsTable
        label="reviews"
        reviewProps={mockReviewProps}
        values={reviews}
      />
    ));

    expect(wrapper.find(StatementReviewsTable)).toBeDefined();
  });

  test('does not crash with empty reviews array ', () => {
    const wrapper = mount((
      <StatementReviewsTable
        label="reviews"
        reviewProps={mockReviewProps}
        values={[]}
      />
    ));

    expect(wrapper.find(StatementReviewsTable)).toBeDefined();
    expect(wrapper.find(DetailChip)).toHaveLength(0);
  });

  test('displays correct number of chips ', () => {
    const wrapper = mount((
      <StatementReviewsTable
        label="reviews"
        reviewProps={mockReviewProps}
        values={reviews}
      />
    ));

    expect(wrapper.find(StatementReviewsTable)).toBeDefined();
    expect(wrapper.find(DetailChip)).toHaveLength(reviews.length);
  });
});
