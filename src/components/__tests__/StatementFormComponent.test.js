import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import StatementFormComponent from '../StatementFormComponent/StatementFormComponent';
import Schema from '../../models/schema';
import classes from '../../models/classes';

const { Statement } = classes;

const testSchema = new Schema({
  test: {
    name: 'test',
    properties: {
      name: { name: 'name', type: 'string' },
    },
  },
  Implies: {
    name: 'Implies',
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
  SupportedBy: {
    name: 'SupportedBy',
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
      summary: {
        name: 'summary',
        type: 'string',
      },
      source: {
        name: 'source',
        type: 'link',
      },
    },
  },
  Statement: {
    name: 'Statement',
    properties: {
      source: {
        name: 'source',
        type: 'link',
      },
      description: {
        name: 'description',
        type: 'string',
      },
      relevance: {
        name: 'relevance',
        type: 'link',
        mandatory: true,
      },
      appliesTo: {
        name: 'appliesTo',
        type: 'link',
        mandatory: true,
      },
    },
  },
});

const validNode = new Statement({
  '@rid': '#1',
  relevance: {
    '@class': 'test',
    '@rid': '#1',
    name: 'hello',
  },
  appliesTo: {
    '@class': 'test',
    '@rid': '#2',
    name: 'goobye',
  },
  in_SupportedBy: [{
    '@class': 'SupportedBy',
    in: { '@rid': '#1' },
    out: { '@rid': '#2' },
  }],
  in_Implies: [{
    '@class': 'Implies',
    in: { '@rid': '#1' },
    out: { '@rid': '#2' },
  }],
}, testSchema);

describe('<StatementFormComponent />', () => {
  let wrapper;

  it('mounts', () => {
    wrapper = mount(
      <StatementFormComponent
        schema={testSchema}
      />,
    );
  });

  it('disabled submit btn', () => {
    wrapper = mount(
      <StatementFormComponent
        schema={testSchema}
      />,
    );

    expect(wrapper.find('#statement-submit-btn').first().props().disabled).to.eq(undefined);
  });

  it('form validity', () => {
    wrapper = mount(
      <StatementFormComponent
        schema={testSchema}
      />,
    );
    wrapper.setState({
      form: {
        relevance: 'asdf',
        'relevance.data': {
          '@class': 'test',
          '@rid': '#1',
          name: 'hello',
        },
        appliesTo: 'asdf',
        'appliesTo.data': {
          '@class': 'test',
          '@rid': '#2',
          name: 'goobye',
        },
      },
      relationships: [
        {
          '@class': 'SupportedBy',
          deleted: true,
        },
      ],
    });
    expect(wrapper.find('#statement-submit-btn').first().props().disabled).to.eq(undefined);
    wrapper.setState({
      relationships: [
        {
          '@class': 'SupportedBy',
        },
        {
          '@class': 'Implies',
        },
      ],
    });
    expect(wrapper.find('#statement-submit-btn').first().props().disabled).to.eq(undefined);
  });

  it('change handlers', () => {
    wrapper = mount(
      <StatementFormComponent
        schema={testSchema}
      />,
    );

    wrapper.find('input[name="relevance"]').simulate('change', {
      target: {
        name: 'relevance',
        value: 'test',
      },
    });
    expect(wrapper.state().form.relevance).to.eq('test');

    wrapper.find('input[name="relevance"]').simulate('change', {
      target: {
        name: 'relevance.data',
        value: {
          name: 'test',
          '@class': 'test',
          '@rid': 'pass',
        },
      },
    });

    expect(wrapper.state().form.relevance).to.eq('pass');
  });

  it('submit', () => {
    const mockSubmit = jest.fn();
    wrapper = mount(
      <StatementFormComponent
        schema={testSchema}
        onSubmit={mockSubmit}
        node={validNode}
      />,
    );
    expect(wrapper.find('#statement-submit-btn').first().props().disabled).to.eq(undefined);
    wrapper.find('#statement-submit-btn').first().simulate('click');
    expect(mockSubmit.mock.calls.length).to.eq(1);
  });
});
