import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { FormControl } from '@material-ui/core';
import ResourceSelectComponent from '../ResourceSelectComponent/ResourceSelectComponent';

const mockData = [
  { name: 'opt-1', '@rid': '#1' },
  { name: 'opt-2', '@rid': '#2' },
  { name: 'opt-3', '@rid': '#3' },
  { name: 'opt-4', '@rid': '#4' },
  { name: 'opt-5', '@rid': '#5' },
];

describe('<ResourceSelectComponent />', () => {
  let wrapper;
  const val = '';

  it('structure', () => {
    wrapper = mount(
      <ResourceSelectComponent
        resources={mockData}
        value={val}
      />,
    );
    expect(wrapper.children().type()).to.equal(FormControl);
  });

  it('other props', () => {
    wrapper = mount(
      <ResourceSelectComponent
        resources={mockData}
        value={val}
        name="test"
      />,
    );
    expect(wrapper.find('input#resource-select-test').props().name).to.equal('test');
  });
});
