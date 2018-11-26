import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import UserGroupDeleteDialog from '../UserGroupForm/UserGroupDeleteDialog/UserGroupDeleteDialog';

let onClose;
let onSubmit;

describe('<UserGroupDeleteDialog />', () => {
  let wrapper;

  beforeEach(() => {
    onClose = jest.fn();
    onSubmit = jest.fn();

    wrapper = mount(
      <UserGroupDeleteDialog
        open
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );
  });

  it('renders without crashing', () => {
    expect(wrapper.type()).to.equal(UserGroupDeleteDialog);
  });

  it('handles delete button', () => {
    wrapper.find('button#delete-btn').simulate('click');
    expect(onSubmit.mock.calls.length).to.eq(1);
  });
});
