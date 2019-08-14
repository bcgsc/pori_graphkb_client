import React from 'react';
import { mount } from 'enzyme';
import { StyledMenuItem } from '../StyledMenu';
import DropDownMenu from '..';
import ActionButton from '../../ActionButton';

describe('DropDownMenu', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const options = ['1', '2', '3', '4'];
  const menuClickSpy = jest.fn();

  it('mounts Successfully', () => {
    const wrapper = mount((
      <DropDownMenu
        options={options}
        handleMenuClick={menuClickSpy}
      />
    ));

    expect(wrapper.find(DropDownMenu)).toHaveLength(1);
  });

  it('displays correct number of options', () => {
    const wrapper = mount((
      <DropDownMenu
        options={options}
        handleMenuClick={menuClickSpy}
        defaultValue="test"
      />
    ));

    const menuBtn = wrapper.find(ActionButton).at(0);
    expect(menuBtn.text()).toEqual('test');
    menuBtn.simulate('click');

    expect(wrapper.find(StyledMenuItem).length).toEqual(4);
  });

  it('displays correct text after selection', () => {
    const wrapper = mount((
      <DropDownMenu
        options={options}
        handleMenuClick={menuClickSpy}
        defaultValue="test"
      />
    ));

    const menuBtn = wrapper.find(ActionButton).at(0);
    expect(menuBtn.text()).toEqual('test');
    menuBtn.simulate('click');
    expect(wrapper.find(StyledMenuItem).length).toEqual(4);

    const firstMenuItem = wrapper.find(StyledMenuItem).at(0);
    firstMenuItem.simulate('click');
    expect(menuBtn.text()).toEqual('1');
    expect(menuClickSpy).toHaveBeenCalledTimes(1);
  });
});
