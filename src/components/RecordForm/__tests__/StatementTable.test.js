import React from 'react';
import { mount } from 'enzyme';

import StatementTable from '../StatementTable';
import DetailChip from '../../DetailChip';
import Schema from '../../../services/schema';

describe('StatementTable', () => {
  const mockStatement = {
    '@class': 'Statement',
    createdAt: 1565911966860,
    appliesTo: { displayName: 'everyone' },
    relevance: { displayName: 'world facts' },
    supportedBy: [
      { displayName: 'Gut Feeling' },
    ],
    impliedBy: [
      { displayName: 'legitimate indicator' },
      { displayName: 'legitimate indicator2' },
    ],
    source: '#24:8',
    sourceId: 'a6e7baa1-497f-403a-af83-31cfe292b787',
    createdBy: '#20:0',
    uuid: '65baf0ff-db23-404f-9513-00a635f91996',
    displayNameTemplate: 'Given {impliedBy} {relevance} applies to {appliesTo} ({supportedBy})',
    reviewStatus: 'passed',
    reviews: [
      {
        '@class': 'StatementReview',
        createdBy: '#19:0',
        status: 'initial',
        createdAt: 1565376648434,
        comment: 'test run2',
      },
    ],
    history: '#82:35648',
    '@rid': '#81:12291',
    '@version': 2,
  };
  const schema = new Schema();

  it('mounts successfully and displays correctly', () => {
    const wrapper = mount((
      <StatementTable
        schema={schema}
        content={mockStatement}
      />
    ));
    wrapper.update();

    expect(wrapper.find(StatementTable)).toBeDefined();
    expect(wrapper.find(DetailChip)).toHaveLength(1);
    const detailChip = wrapper.find(DetailChip).at(0);
    expect(detailChip.text()).toEqual('Given legitimate indicator legitimate indicator...');
  });
});
