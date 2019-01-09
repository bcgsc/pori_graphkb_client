import React from 'react';
import { mount } from 'enzyme';
import StatementFormComponent from '../StatementFormComponent/StatementFormComponent';
import Schema from '../../services/schema';


const testSchema = new Schema({
  Ontology: {
    subclasses: [],
  },
  Variant: {
    subclasses: [],
  },
  V: {
    properties: [],
  },
  E: {
    subclasses: [
      { name: 'ImpliedBy' },
      { name: 'SupportedBy' },
    ],
  },
  test: {
    name: 'test',
    properties: {
      name: { name: 'name', type: 'string' },
    },
    getPreview: () => 'pass',
  },
  ImpliedBy: {
    name: 'ImpliedBy',
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
  Biomarker: {
    name: 'Biomarker',
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

const validNode = {
  '@class': 'Statement',
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
  in_ImpliedBy: [{
    '@class': 'ImpliedBy',
    in: { '@rid': '#1' },
    out: { '@rid': '#2' },
  }],
};

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

    expect(wrapper.find('#statement-submit-btn').first().props().disabled).toBeUndefined();
  });

  it('form validity', () => {
    wrapper = mount(
      <StatementFormComponent
        schema={testSchema}
      />,
    );
    wrapper.setState({
      form: {
        '@class': 'Statement',
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
    expect(wrapper.find('#statement-submit-btn').first().props().disabled).toBeUndefined();
    wrapper.setState({
      relationships: [
        {
          '@class': 'SupportedBy',
        },
        {
          '@class': 'ImpliedBy',
        },
      ],
    });
    expect(wrapper.find('#statement-submit-btn').first().props().disabled).toBeUndefined();
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
    expect(wrapper.state().form.relevance).toBe('test');

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

    expect(wrapper.state().form.relevance).toBe('pass');
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
    expect(wrapper.find('#statement-submit-btn').first().props().disabled).toBeUndefined();
    wrapper.find('#statement-submit-btn').first().simulate('click');
    expect(mockSubmit.mock.calls.length).toBe(1);
  });
});
