import React from 'react';
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
    expect(wrapper.children().type()).toBe(Downshift);
    expect(wrapper.children().children().type()).toBe('div');
    expect(wrapper.find('.autosearch-popper-node').children().type()).toBe(TextField);
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
    expect(wrapper.find('span')).toHaveLength(3);

    expect(wrapper.find('#test1')).toHaveLength(1);
  });

  it('should render default children format when opened', () => {
    wrapper = mount((
      <AutoSearchBase
        options={['test1', 'test2', 'test3']}
      />
    ));
    wrapper.find('input').simulate('change');
    expect(wrapper.find('span')).toHaveLength(6);
  });

  it('should create a chip when an item is selected', () => {
    wrapper = mount((
      <AutoSearchBase
        selected={{ '@rid': '#1', name: 'test record' }}
      />
    ));
    expect(wrapper.find('.record-chip-root').length).toBeGreaterThan(0);
    wrapper.find('.record-chip-root').first().simulate('click');

    wrapper.setProps({ selected: null });
    expect(wrapper.find('.record-chip-root')).toHaveLength(0);
  });
});
