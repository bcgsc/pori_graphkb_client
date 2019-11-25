import { mount } from 'enzyme';
import React from 'react';

import ToggleButtonGroup from '..';
import ConfirmActionDialog from '../../ActionButton/ConfirmActionDialog';

describe('ToggleButtonGroup', () => {
  test('mounts without crashing and burning', () => {
    const wrapper = mount((
      <ToggleButtonGroup
        onClick={jest.fn()}
        options={['view', 'edit']}
        message="Changes you will lose"
      />
    ));

    expect(wrapper.find(ToggleButtonGroup)).toBeDefined();
  });

  test('displays correct number of options', () => {
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

  test('changes selected toggle button on click', () => {
    const wrapper = mount((
      <ToggleButtonGroup
        onClick={jest.fn()}
        options={['view', 'edit']}
        message="Changes you will lose"
      />
    ));

    expect(wrapper.find(ToggleButtonGroup)).toBeDefined();
    expect(wrapper.find('button').length).toBe(2);

    const editBtn = wrapper.find('button').at(1);
    const editSpan = wrapper.find('span').at(3);
    expect(editSpan.hasClass('toggle-button__label--selected')).toEqual(false);
    editBtn.simulate('click');

    const updatedEditSpan = wrapper.find('span').at(3);
    expect(updatedEditSpan.hasClass('toggle-button__label--selected')).toEqual(true);
  });

  test('displays ConfirmActionDialog when confirmation is required', () => {
    const wrapper = mount((
      <ToggleButtonGroup
        onClick={jest.fn()}
        options={['view', 'edit']}
        message="Changes you will lose"
      />
    ));

    expect(wrapper.find(ToggleButtonGroup)).toBeDefined();
    expect(wrapper.find('button').length).toBe(2);
    expect(wrapper.find(ConfirmActionDialog)).toBeDefined();
  });
});
