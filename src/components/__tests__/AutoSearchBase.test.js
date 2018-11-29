import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { TextField } from '@material-ui/core';
import Downshift from 'downshift';
import AutoSearchBase from '../AutoSearchBase/AutoSearchBase';

describe('<AutoSearchBase />', () => {
  let wrapper;

  beforeEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('should correctly render a Downshift component, with nested div and a TextField', () => {
    wrapper = mount(<AutoSearchBase />);
    expect(wrapper.children().type()).to.equal(Downshift);
    expect(wrapper.children().children().type()).to.equal('div');
    expect(wrapper.find('.autosearch-popper-node').children().type()).to.equal(TextField);
  });

  it('should render children when opened', () => {
    wrapper = mount((
      <AutoSearchBase
        options={['test1', 'test2', 'test3']}
      >
        {item => <span id={item}>{item}</span>}
      </AutoSearchBase>
    ));
    wrapper.find('input').simulate('change');
    expect(wrapper.find('span')).to.have.lengthOf(3);

    expect(wrapper.find('#test1')).to.have.lengthOf(1);
  });

  it('should render default children format when opened', () => {
    wrapper = mount((
      <AutoSearchBase
        options={['test1', 'test2', 'test3']}
      />
    ));
    wrapper.find('input').simulate('change');
    expect(wrapper.find('span')).to.have.lengthOf(6);
  });

  it('should create a chip when an item is selected', () => {
    wrapper = mount((
      <AutoSearchBase
        selected={{ '@rid': '#1', name: 'test record' }}
      />
    ));
    expect(wrapper.find('.record-chip-root')).to.have.length.gt(0);
    wrapper.find('.record-chip-root').first().simulate('click');

    wrapper.setProps({ selected: null });
    expect(wrapper.find('.record-chip-root')).to.have.lengthOf(0);
  });
});
