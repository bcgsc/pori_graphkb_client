import React from 'react';
import { mount } from 'enzyme';
import { Typography } from '@material-ui/core';

import StatementSentence from '../StatementSentence';
import Schema from '../../../services/schema';


describe('StatementSentence', () => {
  // patch the schema methods to simplify our mocks
  jest.spyOn(Schema.prototype, 'getPreview').mockImplementation(
    item => item,
  );
  const schema = new Schema();
  test('placeholders used when no content given', () => {
    const wrapper = mount((
      <StatementSentence
        schema={schema}
      />
    ));
    expect(wrapper.find(Typography)).toHaveLength(1);
    const html = wrapper.html();
    expect(html).toContain('[CONDITIONS]');
    expect(html).toContain('[RELEVANCE]');
    expect(html).toContain('[TARGET]');
    expect(html).toContain('[EVIDENCE]');
  });
  test('partial content ok', () => {
    const wrapper = mount((
      <StatementSentence
        schema={schema}
        content={{
          impliedBy: [{ target: 'condition1' }, { target: 'condition2' }],
        }}
      />
    ));
    expect(wrapper.find(Typography)).toHaveLength(3);
    const html = wrapper.html();
    expect(html).toContain('condition1');
    expect(html).toContain('condition2');
    expect(html).toContain('[RELEVANCE]');
    expect(html).toContain('[TARGET]');
    expect(html).toContain('[EVIDENCE]');
  });
  test('replaces all fields when given', () => {
    const wrapper = mount((
      <StatementSentence
        schema={schema}
        content={{
          impliedBy: [{ target: 'KRAS mutation' }],
          appliesTo: 'drugName',
          supportedBy: [{ target: 'PMID:1234' }],
          relevance: 'sensitivity',
        }}
      />
    ));
    expect(wrapper.find(Typography)).toHaveLength(6);
    const html = wrapper.html();
    expect(html).toContain('KRAS');
    expect(html).toContain('mutation');
    expect(html).toContain('sensitivity');
    expect(html).toContain('drugName');
    expect(html).toContain('PMID:1234');
  });
});
