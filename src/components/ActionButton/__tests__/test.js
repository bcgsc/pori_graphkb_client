import React from 'react';
import { mount } from 'enzyme';

import ActionButton from '..';
import ConfirmActionDialog from '../ConfirmActionDialog';


describe('ActionButton', () => {
  const onClick = jest.fn();

  test('uses onClick when requireConfirm flag is false', () => {
    const wrapper = mount((
      <ActionButton
        title="action"
        onClick={onClick}
        requireConfirm={false}
      >
        action
      </ActionButton>
    ));
    wrapper.find('button').prop('onClick')();
    wrapper.update();
    // check that the onClick handler was called
    expect(onClick).toHaveBeenCalled();
    // check that the confimation Dialog box was not rendered
    expect(wrapper.find(ConfirmActionDialog).exists()).toEqual(false);
  });

  test('does not use onClick when requireConfirm flag is given', () => {
    const wrapper = mount((
      <ActionButton
        title="action"
        onClick={onClick}
        requireConfirm
      >
        action
      </ActionButton>
    ));
    wrapper.find('button').prop('onClick')();
    wrapper.update();
    // check that the onClick handler was not called
    expect(onClick).not.toHaveBeenCalled();
    expect(wrapper.find(ConfirmActionDialog).exists()).toEqual(true);
  });

  test.todo('currently cannot test confirm or cancel clicks since the dialog contents renders outside the wrapper element');
  afterEach(() => {
    jest.resetAllMocks();
  });
});
