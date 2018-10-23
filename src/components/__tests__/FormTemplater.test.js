import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import FormTemplater from '../FormTemplater/FormTemplater';
import Schema from '../../models/schema';

describe('<FormTemplater />', () => {
  let wrapper;

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
  const mockSchema = new Schema({
    test: {
      name: 'test',
      properties: mockClass,
    },
    V: { name: 'V', properties: {} },
    child: {
      name: 'child',
      properties: {},
      inherits: ['V'],
      route: '/child',
    },
  });

  const mockModel = {
    name: '',
    otherProp: '',
  };


  it('successfully renders the correct number of list items', () => {
    wrapper = mount(
      <FormTemplater
        schema={mockSchema}
        model={mockModel}
        propSchemas={mockClass}
        onChange={() => { }}
      />,
    );
    expect(wrapper.find('li')).to.have.lengthOf(Object.keys(mockClass).length);
  });

  it('correctly renders different list component', () => {
    wrapper = mount(
      <FormTemplater
        schema={mockSchema}
        model={mockModel}
        propSchemas={mockClass}
        onChange={() => { }}
        fieldComponent="div"
        ignoreRequired
      />,
    );
    expect(wrapper.children()).to.have.lengthOf(Object.keys(mockClass).length);
    wrapper.children()
      .forEach(child => expect(child.children().props().component).to.equal('div'));
  });

  it('successfully groups two properties into single vertical space', () => {
    wrapper = mount(
      <FormTemplater
        schema={mockSchema}
        model={mockModel}
        propSchemas={mockClass}
        onChange={() => { }}
        onClassChange={() => { }}
        fieldComponent="div"
        pairs={{ pair1: ['linkProp', 'boolProp'] }}
      />,
    );

    expect(wrapper.find('.form-templater-group-wrapper')).to.have.length.gte(1);
  });
});
