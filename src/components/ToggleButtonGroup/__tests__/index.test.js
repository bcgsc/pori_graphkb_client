import React from 'react';
import { mount } from 'enzyme';

import ToggleButtonGroup from '..';
import ConfirmActionDialog from '../../ActionButton/ConfirmActionDialog';

describe('ToggleButtonGroup', () => {
  it('mounts without crashing and burning', () => {
    const wrapper = mount((
      <ToggleButtonGroup
        onClick={jest.fn()}
        options={['view', 'edit']}
        message="Changes you will lose"
      />
    ));

    expect(wrapper.find(ToggleButtonGroup)).toBeDefined();
  });

  it('displays correct number of options', () => {
    const wrapper = mount((
      <ToggleButtonGroup
        onClick={jest.fn()}
        options={['view', 'edit']}
        message="Changes you will lose"
      />
    ));

    expect(wrapper.find(ToggleButtonGroup)).toBeDefined();
    expect(wrapper.find('button').length).toBe(2);
  });

  it('doesnt fire onclick with requireConfirm', async () => {
    const clickSpy = jest.fn();
    const wrapper = mount((
      <ToggleButtonGroup
        onClick={clickSpy}
        options={['view', 'edit']}
        message="Changes you will lose"
      />
    ));

    expect(wrapper.find(ToggleButtonGroup)).toBeDefined();
    expect(wrapper.find('button').length).toBe(2);

    const editBtn = wrapper.find('button').at(1);
    const editSpan = wrapper.find('span').at(3);
    expect(editSpan.hasClass('button__label--selected')).toEqual(false);
    await editBtn.simulate('click');
    console.log(wrapper.debug());
    expect(wrapper.find('span').at(3).hasClass('button__label--selected')).toEqual(true);
  });
});
