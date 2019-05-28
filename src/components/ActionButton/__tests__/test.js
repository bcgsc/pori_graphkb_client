import React from 'react';
import { mount } from 'enzyme';
import { Button } from '@material-ui/core';

import ActionButton from '..';
import ConfirmActionDialog from '../ConfirmActionDialog';


describe('ActionButton', () => {
  // const dialogOpenSpy = jest.spyOn(ActionButton.prototype, 'handleOpenDialog');
  const onClick = jest.fn();

  test('does not use dialog when no requestConfirm flag is given', async () => {
    const wrapper = mount((
      <ActionButton
        title="action"
        onClick={onClick}
        requireConfirm={false}
      >
        action
      </ActionButton>
    ));
    await wrapper.find('button').prop('onClick')();
    wrapper.update();
    // check that the onClick handler was called
    expect(onClick).toHaveBeenCalled();
    // check that the confimation Dialog box was not rendered
    expect(wrapper.find(ConfirmActionDialog).exists()).toEqual(false);
  });

  test('uses dialog when requestConfirm flag is given', async () => {
    const wrapper = mount((
      <ActionButton
        title="action"
        onClick={onClick}
        requireConfirm
      >
        action
      </ActionButton>
    ));
    wrapper.update();
    expect(wrapper.find(ConfirmActionDialog).exists()).toEqual(true);
    expect(wrapper.find(Button)).toHaveLength(1);
    const baseBtn = wrapper.find(Button).instance();
    expect(baseBtn.props.className).toEqual('action-button__button');
    const testSpy = jest.fn();
    console.log('baseBtn prop : ', baseBtn.props);
    expect(baseBtn.props.onClick).not.toEqual(onClick);
    // set Button component up with new props.
    await wrapper.setProps({
      children: (
        <Button
          variant={null}
          onClick={
            testSpy
          }
          size="large"
          color="primarytest"
          className="action-button__button"
          disabled={false}
        >
          {'action'}
        </Button>
      ),
    });

    console.log(wrapper.find(Button).at(1).instance().props);
    expect(wrapper.find(Button).at(1).instance().props.onClick).toEqual(testSpy);
    await wrapper.find(Button).at(1).prop('onClick')();
    wrapper.update();
    // check that the onClick handler was not called
    expect(onClick).not.toHaveBeenCalled();
    // check that the dialog handler was called
    expect(testSpy).toHaveBeenCalled();
    console.log('testSpy : ', testSpy.mock);
  });

  // TODO: currently cannot test confirm or cancel clicks since the dialog contents renders outside the wrapper element

  afterEach(() => {
    jest.resetAllMocks();
  });
});
