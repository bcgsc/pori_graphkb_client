import React from 'react';
import { mount } from 'enzyme';
import { Typography, Button, Switch } from '@material-ui/core';

import StyledSwitch from '..';
import ConfirmActionDialog from '../../ActionButton/ConfirmActionDialog';

describe('StyledSwitch', () => {
  it('mounts sucessfully', () => {
    const wrapper = mount((
      <StyledSwitch
        onClick={jest.fn()}
        checked
        opt1="opt1"
        opt2="opt2"
      />
    ));

    expect(wrapper.find(StyledSwitch)).toBeDefined();
  });

  it('displays correct options', () => {
    const wrapper = mount((
      <StyledSwitch
        onClick={jest.fn()}
        checked
        opt1="opt1"
        opt2="opt2"
      />
    ));

    expect(wrapper.find(StyledSwitch)).toBeDefined();
    expect(wrapper.find(Typography)).toHaveLength(2);

    const option1 = wrapper.find(Typography).at(0);
    const option2 = wrapper.find(Typography).at(1);

    expect(option1.text()).toEqual('opt1');
    expect(option2.text()).toEqual('opt2');
  });

  it('selects option correctly', () => {
    const mockCheck = {
      check: false,
    };
    const toggleCheck = (obj) => { obj.check = true; return obj; };

    const wrapper = mount((
      <StyledSwitch
        onClick={() => toggleCheck(mockCheck)}
        checked={mockCheck.check}
        opt1="opt1"
        opt2="opt2"
      />
    ));

    expect(wrapper.find(StyledSwitch)).toBeDefined();
    expect(wrapper.find(Typography)).toHaveLength(2);

    const switchTest = wrapper.find(StyledSwitch).at(0);
    expect(switchTest.prop('checked')).toEqual(false);

    switchTest.prop('onClick')();
    wrapper.update();
    expect(mockCheck.check).toEqual(true);
  });

  it('does not use onClick with requireConfirm flag', () => {
    const toggleCheck = jest.fn();

    const wrapper = mount((
      <StyledSwitch
        onClick={() => toggleCheck()}
        checked
        opt1="opt1"
        opt2="opt2"
        requireConfirm
        message="Are you sure? You will lose everything."
      />
    ));
    expect(wrapper.find(StyledSwitch)).toBeDefined();
    expect(wrapper.find(Typography)).toHaveLength(2);
    expect(wrapper.find(ConfirmActionDialog).exists()).toEqual(true);

    expect(toggleCheck).not.toHaveBeenCalled();
    const switchTest = wrapper.find(Switch).at(0);
    switchTest.prop('onClick')();
    wrapper.update();

    expect(toggleCheck).not.toHaveBeenCalled();
  });
});
