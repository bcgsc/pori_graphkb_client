import React from 'react';
import { mount } from 'enzyme';

import ActionButton from '..';


describe('ActionButton', () => {
  const dialogOpenSpy = jest.spyOn(ActionButton.prototype, 'handleOpenDialog');
  const onClick = jest.fn();

  test('does not use dialog when no requestConfirm flag is given', () => {
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
    // check that the dialog handler was not called
    expect(dialogOpenSpy).not.toHaveBeenCalled();
  });

  test('uses dialog when requestConfirm flag is given', () => {
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
    // check that the dialog handler was called
    expect(dialogOpenSpy).toHaveBeenCalled();
  });

  // TODO: currently cannot test confirm or cancel clicks since the dialog contents renders outside the wrapper element

  afterEach(() => {
    jest.resetAllMocks();
  });
});
