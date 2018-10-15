import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import FormTemplater from './FormTemplater';

describe('<FormTemplater />', () => {
  let wrapper;

  const mockClass = {
    name: {
      name: 'name',
      type: 'string',
    },
    otherProp: {
      name: 'otherProp',
      type: 'integer',
    },
    floatProp: {
      name: 'floatProp',
      type: 'long',
    },
    boolProp: {
      name: 'bool monkey madness',
      type: 'boolean',
    },
    choiceProp: {
      name: 'choices',
      type: 'string',
      choices: ['choice one', 'blargh', 'node js interactive', 'sonic'],
    },
    linkProp: {
      name: 'linkProp',
      type: 'link',
    },
    linkedClassProp: {
      name: 'linkedClassProp',
      type: 'link',
      linkedClass: { name: 'V', route: '/v' },
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
