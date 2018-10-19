import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import FormTemplater from '../FormTemplater/FormTemplater';

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
  const mockSchema = {
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
  };

  const mockModel = {
    name: '',
    otherProp: '',
  };


  it('init', () => {
    wrapper = mount(
      <FormTemplater
        schema={mockSchema}
        model={mockModel}
        kbClass={mockClass}
        onChange={() => { }}
      />,
    );
    expect(wrapper.find('li')).to.have.lengthOf(Object.keys(mockClass).length);
  });

  it('different component', () => {
    wrapper = mount(
      <FormTemplater
        schema={mockSchema}
        model={mockModel}
        kbClass={mockClass}
        onChange={() => { }}
        fieldComponent="div"
        ignoreRequired
      />,
    );
    expect(wrapper.children()).to.have.lengthOf(Object.keys(mockClass).length);
    wrapper.children()
      .forEach(child => expect(child.children().props().component).to.equal('div'));
  });

  it('grouping', () => {
    wrapper = mount(
      <FormTemplater
        schema={mockSchema}
        model={mockModel}
        kbClass={mockClass}
        onChange={() => { }}
        onClassChange={() => { }}
        fieldComponent="div"
        pairs={{ pair1: ['linkProp', 'boolProp'] }}
      />,
    );

    expect(wrapper.find('.form-templater-group-wrapper'));
  });
});
