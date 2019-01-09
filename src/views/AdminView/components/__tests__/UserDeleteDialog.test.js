import React from 'react';
import { mount } from 'enzyme';
import UserDeleteDialog from '../UserForm/UserDeleteDialog';


const testUsers = [
  {
    '@class': 'User',
    name: 'test user 1',
    '@rid': '#testuser1',
    groups: [
      { '@rid': '#8', name: 'test usergroup', permissions: {} },
      { '@rid': '#4', name: 'test usergroup 2', permissions: {} },
    ],
  },
  {
    '@class': 'User',
    name: 'test user 2',
    '@rid': '#testuser2',
    groups: [
      { '@rid': '#8', name: 'test usergroup', permissions: {} },
    ],
  },
  {
    '@class': 'User',
    name: 'test user 3',
    '@rid': '#testuser3',
    groups: [
      { '@rid': '#64', name: 'test usergroup 3', permissions: {} },
    ],
  },
];

let onClose;
let onSubmit;
let onCancel;

describe('<UserDeleteDialog />', () => {
  let wrapper;

  beforeEach(() => {
    onClose = jest.fn();
    onSubmit = jest.fn();
    onCancel = jest.fn();

    wrapper = mount(
      <UserDeleteDialog
        open
        onClose={onClose}
        onSubmit={onSubmit}
        onCancel={onCancel}
        users={testUsers}
        selected={[]}
      />,
    );
  });

  it('renders without crashing', () => {
    expect(wrapper.type()).toBe(UserDeleteDialog);
  });

  it('handles cancel button', () => {
    wrapper = mount(
      <UserDeleteDialog
        open
        onClose={onClose}
        onSubmit={onSubmit}
        onCancel={onCancel}
        users={testUsers}
        selected={['#testuser3']}
      />,
    );
    wrapper.find('ul button').first().simulate('click');
    expect(onCancel.mock.calls.length).toBe(1);
  });
});
