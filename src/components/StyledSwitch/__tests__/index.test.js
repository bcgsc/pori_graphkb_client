import React from 'react';
import { mount } from 'enzyme';
import { Typography } from '@material-ui/core';

import StyledSwitch from '..';

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

  it('selects option correctly', async () => {
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

    await switchTest.prop('onClick')();
    wrapper.update();
    expect(mockCheck.check).toEqual(true);
  });
});
