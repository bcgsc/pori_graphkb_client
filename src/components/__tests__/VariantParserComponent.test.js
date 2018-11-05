import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { spy } from 'sinon';
import VariantParserComponent from '../VariantParserComponent/VariantParserComponent';
import Schema from '../../models/schema';


const mockClass = {
  name: {
    name: 'name',
    type: 'string',
    mandatory: true,
  },
  otherProp: {
    name: 'otherProp',
    type: 'integer',
    description: 'blargh',
    max: 10,
    min: 1,
    mandatory: true,
  },
  floatProp: {
    name: 'floatProp',
    type: 'long',
    description: 'blargh',
  },
  boolProp: {
    name: 'bool monkey madness',
    type: 'boolean',
    description: 'blargh',
  },
  choiceProp: {
    name: 'choices',
    type: 'string',
    choices: ['choice one', 'blargh', 'node js interactive', 'sonic'],
    mandatory: true,
  },
  linkProp: {
    name: 'linkProp',
    type: 'link',
    description: 'blargh',
  },
  linkedClassProp: {
    name: 'linkedClassProp',
    type: 'link',
    linkedClass: { name: 'V', route: '/v' },
    description: 'blargh',
    mandatory: true,
  },
  embeddedProp: {
    name: 'embeddedProp',
    type: 'embedded',
    linkedClass: { name: 'V', route: '/V' },
  },
};
let mockSchema;

describe('<VariantParserComponent />', () => {
  let wrapper;

  beforeAll(() => {
    spy(VariantParserComponent.prototype, 'componentDidMount');
  });

  beforeEach(() => {
    mockSchema = new Schema({
      PositionalVariant: {
        name: 'PositionalVariant',
        properties: { name: { name: 'name', type: 'string' } },
      },
      test: {
        name: 'test',
        properties: mockClass,
      },
      V: { name: 'V', properties: {} },
      child: {
        name: 'child',
        properties: { name: { name: 'name', type: 'string' } },
        inherits: ['V'],
        route: '/child',
      },
      embedded: {
        name: 'embedded',
        properties: { name: { name: 'embeddedName', type: 'string' } },
        inherits: [],
        route: '/embedded',
      },
    });
  });

  it('calls componentDidMount and doesn\' die', () => {
    const handleFinish = jest.fn();
    wrapper = mount(
      <VariantParserComponent
        handleFinish={handleFinish}
        schema={mockSchema}
      />,
    );
    expect(VariantParserComponent.prototype.componentDidMount).to.have.property('callCount', 1);
  });

  it('correctly calls handlers on shorthand change and form fields', () => {
    const handleSubmit = jest.fn();
    wrapper = mount(
      <VariantParserComponent
        handleFinish={() => { }}
        handleSubmit={handleSubmit}
        schema={mockSchema}
      />,
    );
    expect(wrapper.type()).to.eq(VariantParserComponent);
    wrapper.find('input[name="shorthand"]').simulate('change', { target: { value: 'test test' } });
    expect(wrapper.find('input[name="shorthand"]').props().value).to.eq('test test');
    wrapper.find('textarea[name="name"]').simulate('change', { target: { value: 'test name' } });

    wrapper.find('input[name="shorthand"]').simulate('change', { target: { value: 'brca2:p.g12del' } });
    wrapper.setState({ invalidFlag: false });
    wrapper.find('#variant-form-submit button').simulate('click');
    expect(handleSubmit.mock.calls.length).to.eq(1);
  });

  it('disables submit button if form state is invalid', () => {
    const handleSubmit = jest.fn();
    mockSchema.schema.PositionalVariant.properties.name.mandatory = true;
    mockSchema.schema.PositionalVariant.properties.link = {
      name: 'link',
      type: 'link',
      mandatory: true,
    };
    wrapper = mount(
      <VariantParserComponent
        handleFinish={() => { }}
        handleSubmit={handleSubmit}
        schema={mockSchema}
      />,
    );
    expect(wrapper.find('#variant-form-submit button').getDOMNode())
      .to.have.property('disabled');
  });

  it('correctly updates shorthand', () => {
    mockSchema.schema.PositionalVariant.properties.break1Start = {
      type: 'embedded',
      name: 'break1Start',
      linkedClass: {
        name: 'embed',
        properties: {},
      },
    };
    mockSchema.schema.PositionalVariant.properties.break1End = {
      type: 'embedded',
      name: 'break1End',
      linkedClass: {
        name: 'embed',
        properties: {},
      },
    };
    mockSchema.schema.PositionalVariant.properties.type = {
      type: 'link',
      name: 'type',
    };

    const handleSubmit = jest.fn();
    wrapper = mount(
      <VariantParserComponent
        handleFinish={() => { }}
        handleSubmit={handleSubmit}
        schema={mockSchema}
      />,
    );
    wrapper.find('input[name="shorthand"]').simulate('change', { target: { value: 'brca2:p.g_12del' } });
    wrapper.find('input[name="shorthand"]').simulate('change', { target: { value: 'brca2:p.g11_12daal' } });
    wrapper.setState({
      variant: {
        break1Repr: 'p.g11',
        break1Start: {
          '@class': 'ProteinPosition',
          pos: 11,
          refAA: 'g',
        },
        break2Repr: 'p.?12',
        break2Start: {
          '@class': 'ProteinPosition',
          pos: 12,
          refAA: '',
        },
        reference1: 'brca2',
        type: 'deletion',
      },
    });
    wrapper.find('textarea[name="name"]').simulate('change');
    expect(wrapper.state().shorthand).to.eq('brca2:p.g11_?12del');
  });

  it('handles nested properties changing', () => {
    mockSchema.schema.PositionalVariant.properties.break1Start = {
      type: 'embedded',
      name: 'break1Start',
      linkedClass: {
        name: 'embedded',
        properties: { name: { name: 'embeddedName', type: 'string' } },
        inherits: [],
        route: '/embedded',
      },
    };
    mockSchema.schema.PositionalVariant.properties.type = {
      type: 'link',
      name: 'type',
    };
    wrapper = mount(
      <VariantParserComponent
        handleFinish={() => { }}
        handleSubmit={() => { }}
        schema={mockSchema}
      />,
    );
    wrapper.find('textarea[name="name"]')
      .simulate('change', { target: { name: 'name', value: 'pass' } });
    expect(wrapper.find('textarea[name="name"]').props().value).to.eq('pass');
    wrapper.find('input[name="type"]')
      .simulate('change', { target: { name: 'type', value: 'pass', '@rid': '#1234' } });
  });
});
