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
      type: 'number',
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
      linkedClass: { name: 'V', route: '/v' },
    },
  };
  const mockSchema = {
    test: {
      name: 'test',
      properties: mockClass,
    },
    V: { name: 'V', properties: {} },
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

  it('fleshed out model', () => {
    wrapper = mount(
      <FormTemplater
        schema={mockSchema}
        model={mockModel}
        kbClass={mockClass}
        onChange={() => { }}
      />,
    );
  });
});
