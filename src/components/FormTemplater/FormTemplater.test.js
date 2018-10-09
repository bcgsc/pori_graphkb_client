import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import FormTemplater from './FormTemplater';

describe('<FormTemplater />', () => {
  let wrapper;
  const mockSchema = {
    test: {
      name: 'test',
      properties: {
        name: {
          name: 'name',
          type: 'string',
        },
        otherProp: {
          name: 'otherProp',
          type: 'number',
        },
      },
    },
    V: { name: 'V', properties: {} },
  };

  const mockModel = {
    name: '',
    otherProp: '',
  };

  const mockClass = {
    name: {
      name: 'name',
      type: 'string',
    },
    otherProp: {
      name: 'otherProp',
      type: 'number',
    },
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
    expect(wrapper.find('li')).to.have.lengthOf(2);
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
    expect(wrapper.children()).to.have.lengthOf(2);
    wrapper.children()
      .forEach(child => expect(child.children().props().component).to.equal('div'));
  });
});
