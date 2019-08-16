import React from 'react';
import { mount } from 'enzyme';

import { Chip, IconButton } from '@material-ui/core';
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

  it('mounts successfully', () => {
    const wrapper = mount((
      <EmbeddedListTable
        label="reviews"
        values={reviews}
        handleReviewSelection={jest.fn()}
      />
    ));

    expect(wrapper.find(EmbeddedListTable)).toBeDefined();
  });

  it('does not crash with empty reviews array ', () => {
    const wrapper = mount((
      <EmbeddedListTable
        label="reviews"
        values={[]}
        handleReviewSelection={jest.fn()}
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
        handleReviewSelection={jest.fn()}
      />
    ));

    expect(wrapper.find(EmbeddedListTable)).toBeDefined();
    expect(wrapper.find(DetailChip)).toHaveLength(reviews.length);
  });

  it('detailChip calls review selection handler ', () => {
    const selectionSpy = jest.fn();
    const wrapper = mount((
      <EmbeddedListTable
        label="reviews"
        values={reviews}
        handleReviewSelection={selectionSpy}
      />
    ));

    expect(wrapper.find(EmbeddedListTable)).toBeDefined();
    expect(wrapper.find(Chip)).toHaveLength(reviews.length);
    const detailChip = wrapper.find(Chip).at(0);
    detailChip.simulate('click'); // opens pop-over

    expect(wrapper.find(IconButton)).toHaveLength(1);
    const linkBtn = wrapper.find(IconButton).at(0);
    linkBtn.prop('onClick')();
    expect(selectionSpy).toHaveBeenCalledTimes(1);
  });
});
