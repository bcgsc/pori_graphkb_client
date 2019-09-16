import React from 'react';
import { mount } from 'enzyme';

import EmbeddedListTable from '../FormField/EmbeddedListTable';
import DetailChip from '../../DetailChip';


describe('EmbeddedListTable', () => {
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

  it('mounts successfully', () => {
    const wrapper = mount((
      <EmbeddedListTable
        label="reviews"
        values={reviews}
        reviewProps={mockReviewProps}
      />
    ));

    expect(wrapper.find(EmbeddedListTable)).toBeDefined();
  });

  it('does not crash with empty reviews array ', () => {
    const wrapper = mount((
      <EmbeddedListTable
        label="reviews"
        values={[]}
        reviewProps={mockReviewProps}
      />
    ));

    expect(wrapper.find(EmbeddedListTable)).toBeDefined();
    expect(wrapper.find(DetailChip)).toHaveLength(0);
  });

  it('displays correct number of chips ', () => {
    const wrapper = mount((
      <EmbeddedListTable
        label="reviews"
        values={reviews}
        reviewProps={mockReviewProps}
      />
    ));

    expect(wrapper.find(EmbeddedListTable)).toBeDefined();
    expect(wrapper.find(DetailChip)).toHaveLength(reviews.length);
  });
});
