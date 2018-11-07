import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import RelationshipsForm from '../RelationshipsForm/RelationshipsForm';
import Schema from '../../models/schema';

const testSchema = new Schema({
  AliasOf: {
    name: 'AliasOf',
    inherits: ['E'],
    properties: {
      in: {
        name: 'in',
        type: 'link',
      },
      out: {
        name: 'out',
        type: 'link',
      },
      source: {
        name: 'source',
        type: 'link',
      },
    },
  },
});

describe('<RelationshipsForm />', () => {
  let wrapper;

  it('mounts', () => {
    wrapper = mount(
      <RelationshipsForm
        schema={testSchema}
        onChange={() => { }}
      />,
    );
  });

  it('form does not add empty relationship, modifies staged new relationship correctly', () => {
    const relationships = [];
    const mock = jest.fn();

    wrapper = mount(
      <RelationshipsForm
        schema={testSchema}
        onChange={mock}
        relationships={relationships}
      />,
    );
    expect(wrapper.find('#relationships-form-submit').first().props().disabled).to.eq(true);
    expect(wrapper.find('table.relationships-form-table tr')).to.have.lengthOf(2);

    wrapper.find('input[name="in"]')
      .simulate('change', { target: { value: 'test', '@rid': '#9', sourceId: 'testId' } });
    wrapper.find('button.relationship-direction-btn').simulate('click');
    wrapper.find('input[name="out"]')
      .simulate('change', { target: { value: 'test', '@rid': '#9', sourceId: 'testId' } });

    wrapper.find('button.relationship-direction-btn').simulate('click');
    wrapper.find('div.resource-select input').simulate('change', { target: { value: 'test type' } });
    wrapper.find('input[name="source"]').simulate('change', { target: { value: 'test source' } });

    wrapper.setState({
      model: {
        '@class': 'AliasOf',
        in: 'test relationship',
        'in.data': {
          sourceId: 'test relationship id',
          '@rid': '#1',
        },
        'out.data': {
          '@rid': '#23',
        },
        'source.data': {
          '@rid': '#source',
        },
        '@rid': 'test:01',
      },
    });
    wrapper.find('button.relationship-direction-btn').simulate('click');
    wrapper.find('#relationships-form-submit').first().simulate('click');
    expect(mock.mock.calls.length).to.eq(1);
    wrapper.find('table.relationships-form-table tbody tr td button')
      .first()
      .simulate('click');
    expect(wrapper.find('tr.deleted')).to.have.lengthOf(0);
  });

  it('minimize button', () => {
    wrapper = mount(
      <RelationshipsForm
        schema={testSchema}
        onChange={() => { }}
      />,
    );

    expect(wrapper.find('button.minimize-open')).to.have.lengthOf(1);
    wrapper.find('button.relationships-minimize-btn').simulate('click');
    expect(wrapper.find('button.minimize-open')).to.have.lengthOf(0);
  });

  it('initial relationships', () => {
    wrapper = mount(
      <RelationshipsForm
        schema={testSchema}
        onChange={() => { }}
        relationships={[
          {
            '@class': 'AliasOf',
            'in.data': {
              '@rid': '#2',
            },
            'out.data': {
              '@rid': '#6',
            },
            '@rid': '#5',
          },
        ]}
      />,
    );

    wrapper.find('table tbody tr td button').first().simulate('click');
    wrapper.setState({});
    expect(wrapper.find('tr.deleted')).to.have.lengthOf(1);
    wrapper.find('table tbody tr td button').first().simulate('click');
  });

  it('invalid model', () => {
    testSchema.schema.AliasOf.properties.new = {
      name: 'new',
      type: 'string',
      mandatory: true,
    };
    wrapper = mount(
      <RelationshipsForm
        schema={testSchema}
        onChange={() => { }}
      />,
    );

    expect(wrapper.find('#relationships-form-submit').first().props().disabled).to.eq(true);
  });
});
