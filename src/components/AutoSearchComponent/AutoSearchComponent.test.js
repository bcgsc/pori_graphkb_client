import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { TextField } from '@material-ui/core';
import Downshift from 'downshift';
import AutoSearchComponent from './AutoSearchComponent';

describe('<AutoSearchComponent />', () => {
  let wrapper;

  it('structure', () => {
    wrapper = mount(<AutoSearchComponent />);
    expect(wrapper.children().type()).to.equal(Downshift);
    expect(wrapper.children().children().type()).to.equal('div');
    expect(wrapper.find('.autosearch-popper-node').children().type()).to.equal(TextField);
  });

  it('allows props', () => {
    wrapper = mount((
      <AutoSearchComponent
        name="testName"
        label="testLabel"
        placeholder="testPlaceHolder"
        disabled
      />));
    expect(wrapper.find('input').props().name).to.equal('testName');
    expect(wrapper.find('input').props().placeholder).to.equal('testPlaceHolder');
    expect(wrapper.find('label').text()).to.equal('testLabel');
    expect(wrapper.find('input').props().disabled).to.equal(true);
  });
});
